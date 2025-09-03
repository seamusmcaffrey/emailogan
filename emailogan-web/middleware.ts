import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if environment variables are set
  const requiredEnvVars = [
    'OPENAI_API_KEY',
    'PINECONE_API_KEY',
    'JWT_SECRET',
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName] || process.env[varName] === 'your_' + varName.toLowerCase() + '_here'
  );

  // If accessing API routes and missing env vars, return error
  if (request.nextUrl.pathname.startsWith('/api/') && missingVars.length > 0) {
    if (request.nextUrl.pathname === '/api/auth/login') {
      // Allow login endpoint to work with default password
      return NextResponse.next();
    }
    
    return NextResponse.json(
      { 
        error: 'Server not configured', 
        message: 'Missing required environment variables. Please configure the application.',
        missing: missingVars 
      },
      { status: 503 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};