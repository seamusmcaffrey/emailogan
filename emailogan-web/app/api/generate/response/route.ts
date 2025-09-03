import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromHeaders } from '@/lib/auth';
import { queryVectors } from '@/lib/pinecone';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const maxDuration = 30;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build',
});

const RESPONSE_STYLES = {
  professional: 'professional and formal',
  friendly: 'friendly and conversational',
  concise: 'brief and to the point',
  detailed: 'comprehensive and thorough',
};

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
    
    const { prompt, style = 'professional', useKnowledgeBase = true } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }
    
    let context = '';
    let sourceEmails: Array<{ from: string; to: string; subject: string; date: string; body: string }> = [];
    
    if (useKnowledgeBase) {
      // Generate embedding for the prompt
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: prompt,
      });
      
      const queryEmbedding = embeddingResponse.data[0].embedding;
      
      // Search for relevant emails
      const matches = await queryVectors(queryEmbedding, 3);
      
      if (matches.length > 0) {
        sourceEmails = matches.map((match) => match.metadata as { from: string; to: string; subject: string; date: string; body: string });
        context = matches.map((match) => {
          const meta = match.metadata as { from: string; to: string; subject: string; date: string; body: string };
          return `Email from ${meta.from} to ${meta.to} about "${meta.subject}": ${meta.body}`;
        }).join('\n\n');
      }
    }
    
    // Generate response
    const systemPrompt = `You are an AI assistant helping to draft email responses. 
    ${context ? `Use the following email context to inform your response:\n${context}\n\n` : ''}
    Write in a ${RESPONSE_STYLES[style as keyof typeof RESPONSE_STYLES] || RESPONSE_STYLES.professional} tone.`;
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });
    
    const response = completion.choices[0].message.content;
    
    return NextResponse.json({
      success: true,
      response,
      sourceEmails,
      style,
    });
  } catch (error) {
    console.error('Response generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
}