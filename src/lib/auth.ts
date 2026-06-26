import { cookies } from 'next/headers';
import { prisma } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'cpmas-super-secret-key-change-in-production';

// We use Web Crypto API to sign and verify JWTs so they are compatible with Next.js Middleware/Edge runtime.
const encoder = new TextEncoder();
const keyPromise = crypto.subtle.importKey(
  'raw',
  encoder.encode(JWT_SECRET),
  { name: 'HMAC', hash: 'SHA-256' },
  false,
  ['sign', 'verify']
);

function base64urlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return atob(str);
}

export async function signJWT(payload: any, expiresInSeconds = 86400): Promise<string> {
  const key = await keyPromise;
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  
  const segments = [
    base64urlEncode(JSON.stringify(header)),
    base64urlEncode(JSON.stringify({ ...payload, exp })),
  ];
  
  const dataToSign = segments.join('.');
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(dataToSign)
  );
  
  const signatureBase64 = base64urlEncode(
    String.fromCharCode(...new Uint8Array(signature))
  );
  
  return [...segments, signatureBase64].join('.');
}

export async function verifyJWT(token: string): Promise<any | null> {
  try {
    const key = await keyPromise;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [headerB64, payloadB64, signatureB64] = parts;
    const dataToVerify = `${headerB64}.${payloadB64}`;
    
    const signatureBytes = new Uint8Array(
      base64urlDecode(signatureB64)
        .split('')
        .map((c) => c.charCodeAt(0))
    );
    
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      encoder.encode(dataToVerify)
    );
    
    if (!isValid) return null;
    
    const payload = JSON.parse(base64urlDecode(payloadB64));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null; // Expired
    }
    
    return payload;
  } catch (err) {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  
  const payload = await verifyJWT(token);
  if (!payload || !payload.id) return null;
  
  try {
    return await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });
  } catch {
    return null;
  }
}

export const ROLE_HIERARCHY = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  ACCOUNTANT: 2,
  PROJECT_MANAGER: 1,
  DATA_ENTRY_OPERATOR: 0,
} as const;

export type UserRole = keyof typeof ROLE_HIERARCHY;

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
