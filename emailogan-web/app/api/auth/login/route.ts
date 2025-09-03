import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyPassword, generateToken } from '@/lib/auth';

const loginSchema = z.object({
  password: z.string().min(1),
});

const ADMIN_PASSWORD_HASH = '$2b$12$.P2Pj.01uKZPAa6x.V6oo.guDz8aDocBkLkLhsV/tuBbd4YFel7wK'; // "blocklogan1988" hashed

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = loginSchema.parse(body);
    
    const isValid = await verifyPassword(password, ADMIN_PASSWORD_HASH);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }
    
    const token = generateToken({
      id: 'admin',
      email: 'admin@emailogan.com',
    });
    
    const response = NextResponse.json({
      success: true,
      token,
    });
    
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}