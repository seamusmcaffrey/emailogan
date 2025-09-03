import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromHeaders } from '@/lib/auth';
import { upsertEmailVectors, EmailVector } from '@/lib/pinecone';

export const runtime = 'nodejs';

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
    
    const { emails } = await request.json();
    
    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json(
        { error: 'Invalid emails data' },
        { status: 400 }
      );
    }
    
    const vectors: EmailVector[] = emails.map(email => ({
      id: email.id,
      values: email.embedding,
      metadata: {
        from: email.from,
        to: email.to,
        subject: email.subject,
        date: email.date,
        body: email.body.substring(0, 1000), // Limit metadata size
      },
    }));
    
    const result = await upsertEmailVectors(vectors);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Vector storage error:', error);
    return NextResponse.json(
      { error: 'Failed to store vectors' },
      { status: 500 }
    );
  }
}