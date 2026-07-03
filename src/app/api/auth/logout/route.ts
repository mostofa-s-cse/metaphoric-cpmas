import { NextResponse } from 'next/server';

const PATH = '/api/auth/logout';

export async function POST() {
  const response = NextResponse.json({
    status: 'success',
    message: 'Logged out successfully',
    data: null,
    timestamp: new Date().toISOString(),
    path: PATH,
  });
  
  // Clear cookie
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
  
  return response;
}
