import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromHeaders } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeaders(request.headers) || 
                  request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }
    
    const user = verifyToken(token);
    
    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    );
  }
}