import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromHeaders } from '@/lib/auth';
import { parseEmailContent, sanitizeEmailForEmbedding } from '@/lib/email-parser';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build',
});

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
    
    const processedEmails = [];
    
    for (const emailContent of emails) {
      const parsedEmail = typeof emailContent === 'string' 
        ? parseEmailContent(emailContent)
        : emailContent;
      
      const textForEmbedding = sanitizeEmailForEmbedding(parsedEmail);
      
      // Generate embedding
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: textForEmbedding,
      });
      
      processedEmails.push({
        ...parsedEmail,
        embedding: embeddingResponse.data[0].embedding,
        processedAt: new Date().toISOString(),
      });
    }
    
    return NextResponse.json({
      success: true,
      processed: processedEmails.length,
      emails: processedEmails,
    });
  } catch (error) {
    console.error('Email processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process emails' },
      { status: 500 }
    );
  }
}