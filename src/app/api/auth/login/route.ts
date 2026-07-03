import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { signJWT } from '@/lib/auth';
import { apiBadRequest, apiError } from '@/lib/apiResponse';
import { withErrorHandler } from '@/lib/errorHandler';

const PATH = '/api/auth/login';

async function postHandler(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return apiBadRequest('Email and password are required', PATH);
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    return apiError('Invalid email or password', PATH, 401);
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    return apiError('Invalid email or password', PATH, 401);
  }

  // Sign JWT
  const token = await signJWT({
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
  });

  // Create success response using standard envelope manually to allow setting cookies
  const response = NextResponse.json({
    status: 'success',
    message: "Welcome back! You've logged in successfully.",
    data: {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        profileImage: user.profileImage,
      },
    },
    timestamp: new Date().toISOString(),
    path: PATH,
  });

  // Set cookie (HTTP-only, secure, sameSite)
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 86400, // 1 day
    path: '/',
  });

  // Audit Log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'USER_LOGIN',
      details: `User logged in: ${user.email}`,
    },
  });

  return response;
}

export const POST = withErrorHandler(postHandler, PATH);
