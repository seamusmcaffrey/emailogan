import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromHeaders } from '@/lib/auth';
import { upsertEmailVectors, EmailVector } from '@/lib/pinecone';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  console.log('🗄️ Vector store endpoint called');
  console.log('📌 Pinecone API Key present:', !!process.env.PINECONE_API_KEY);
  
  try {
    const token = getTokenFromHeaders(request.headers) || 
                  request.cookies.get('auth-token')?.value;
    
    if (!token) {
      console.error('❌ No auth token found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    try {
      verifyToken(token);
      console.log('✅ Token verified');
    } catch {
      console.error('❌ Invalid token');
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    const { emails } = await request.json();
    console.log(`📧 Storing ${emails?.length || 0} emails in vector database`);
    
    if (!emails || !Array.isArray(emails)) {
      console.error('❌ Invalid emails data');
      return NextResponse.json(
        { error: 'Invalid emails data' },
        { status: 400 }
      );
    }
    
    if (!process.env.PINECONE_API_KEY || process.env.PINECONE_API_KEY === 'dummy-key-for-build') {
      console.error('❌ PINECONE_API_KEY not configured properly');
      return NextResponse.json(
        { error: 'Pinecone API key not configured. Please set PINECONE_API_KEY in environment variables.' },
        { status: 500 }
      );
    }
    
    console.log('🔄 Preparing vectors for storage...');
    const vectors: EmailVector[] = emails.map((email, index) => {
      // Log sample of what we're storing
      if (index < 2) {
        console.log(`📧 Email ${index + 1} sample:`);
        console.log(`  Subject: ${email.subject}`);
        console.log(`  Body length: ${email.body?.length} chars`);
        console.log(`  Body preview: ${email.body?.substring(0, 200)}...`);
      }
      
      return {
        id: email.id,
        values: email.embedding,
        metadata: {
          from: email.from,
          to: email.to,
          subject: email.subject,
          date: typeof email.date === 'string' ? email.date : new Date(email.date).toISOString(),
          body: email.body.substring(0, 4000), // Increased limit to capture full Spock style
        },
      };
    });
    
    console.log(`📦 Upserting ${vectors.length} vectors to Pinecone...`);
    const result = await upsertEmailVectors(vectors);
    console.log('✅ Vectors stored successfully:', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Vector storage error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to store vectors',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}