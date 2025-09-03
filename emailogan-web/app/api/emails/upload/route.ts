import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromHeaders } from '@/lib/auth';
import { parseEmailContent } from '@/lib/email-parser';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromHeaders(request.headers) || 
                  request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    try {
      verifyToken(token);
    } catch {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    if (!file.name.endsWith('.eml')) {
      return NextResponse.json(
        { error: 'Only .eml files are supported' },
        { status: 400 }
      );
    }
    
    const content = await file.text();
    const parsedEmail = parseEmailContent(content);
    
    // Store in memory or database (for now, just return)
    return NextResponse.json({
      success: true,
      email: parsedEmail,
    });
  } catch (error) {
    console.error('Email upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process email' },
      { status: 500 }
    );
  }
}