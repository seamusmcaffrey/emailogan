import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromHeaders } from '@/lib/auth';
import { parseEmailContent } from '@/lib/email-parser';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  console.log('📨 API: Email upload request received');
  
  try {
    const token = getTokenFromHeaders(request.headers) || 
                  request.cookies.get('auth-token')?.value;
    
    console.log('🔐 Token present:', !!token);
    
    if (!token) {
      console.warn('⚠️ No authentication token provided');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    try {
      verifyToken(token);
      console.log('✅ Token verified successfully');
    } catch (error) {
      console.error('❌ Token verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    console.log('📦 Parsing form data...');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error('❌ No file in form data');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    console.log(`📄 File received: ${file.name} (${file.size} bytes, type: ${file.type})`);
    
    if (!file.name.endsWith('.eml')) {
      console.warn(`⚠️ Invalid file type: ${file.name}`);
      return NextResponse.json(
        { error: 'Only .eml files are supported' },
        { status: 400 }
      );
    }
    
    console.log('🔍 Reading and parsing email content...');
    const content = await file.text();
    console.log(`📏 Email content length: ${content.length} characters`);
    
    const parsedEmail = parseEmailContent(content);
    console.log('✅ Email parsed successfully:', {
      from: parsedEmail.from,
      subject: parsedEmail.subject,
      date: parsedEmail.date,
      bodyLength: parsedEmail.body?.length || 0
    });
    
    // Store in memory or database (for now, just return)
    return NextResponse.json({
      success: true,
      email: parsedEmail,
    });
  } catch (error) {
    console.error('❌ Email upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process email' },
      { status: 500 }
    );
  }
}