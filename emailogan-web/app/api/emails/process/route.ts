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
  console.log('🔬 Process endpoint called');
  console.log('🔑 OpenAI API Key present:', !!process.env.OPENAI_API_KEY);
  
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
    console.log(`📧 Processing ${emails?.length || 0} emails`);
    
    if (!emails || !Array.isArray(emails)) {
      console.error('❌ Invalid emails data');
      return NextResponse.json(
        { error: 'Invalid emails data' },
        { status: 400 }
      );
    }
    
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key-for-build') {
      console.error('❌ OPENAI_API_KEY not configured properly');
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in environment variables.' },
        { status: 500 }
      );
    }
    
    const processedEmails = [];
    
    for (let i = 0; i < emails.length; i++) {
      try {
        console.log(`📝 Processing email ${i + 1}/${emails.length}`);
        const emailContent = emails[i];
        const parsedEmail = typeof emailContent === 'string' 
          ? parseEmailContent(emailContent)
          : emailContent;
        
        const textForEmbedding = sanitizeEmailForEmbedding(parsedEmail);
        console.log(`📏 Text length for embedding: ${textForEmbedding.length}`);
        
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
        console.log(`✅ Email ${i + 1} processed successfully`);
      } catch (emailError) {
        console.error(`❌ Error processing email ${i + 1}:`, emailError);
        throw emailError;
      }
    }
    
    console.log(`✨ All ${processedEmails.length} emails processed successfully`);
    return NextResponse.json({
      success: true,
      processed: processedEmails.length,
      emails: processedEmails,
    });
  } catch (error) {
    console.error('❌ Email processing error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to process emails',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}