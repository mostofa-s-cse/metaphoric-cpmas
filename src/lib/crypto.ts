import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const RAW_KEY = process.env.ENCRYPTION_KEY || 'v3y-s3cr3t-k3y-32-bytes-long-123';

// Hash the raw key with SHA-256 to guarantee it is exactly 32 bytes (256 bits)
const SECRET_KEY = crypto.createHash('sha256').update(RAW_KEY).digest();
const IV_LENGTH = 16;

/**
 * Encrypt a text or numeric value into a hex string ciphertext.
 */
export function encrypt(text: string | number | null | undefined): string {
  if (text === null || text === undefined) {
    return '';
  }
  const strVal = String(text);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  let encrypted = cipher.update(strVal);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Decrypt a hex ciphertext back into raw text.
 */
export function decrypt(text: string | null | undefined): string {
  if (!text || typeof text !== 'string' || !text.includes(':')) {
    return text || '';
  }
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    // Return original ciphertext on decryption failure to prevent server crashes
    return text;
  }
}

/**
 * Decrypt a hex ciphertext directly into a float number.
 */
export function decryptToFloat(text: string | null | undefined): number {
  if (text === null || text === undefined) return 0.0;
  const decrypted = decrypt(String(text));
  const parsed = parseFloat(decrypted);
  return isNaN(parsed) ? 0.0 : parsed;
}
