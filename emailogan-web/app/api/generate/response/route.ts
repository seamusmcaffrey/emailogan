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
    console.log('Generate API called');
    
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
    console.log('Request params:', { style, useKnowledgeBase, promptLength: prompt?.length });
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }
    
    let context = '';
    let sourceEmails: Array<{ from: string; to: string; subject: string; date: string; body: string }> = [];
    
    if (useKnowledgeBase) {
      console.log('Using knowledge base - generating embeddings...');
      
      // Generate embedding for the prompt
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: prompt,
      });
      console.log('OpenAI embedding generated');
      
      const queryEmbedding = embeddingResponse.data[0].embedding;
      
      // Search for relevant emails
      console.log('Querying vector database...');
      const matches = await queryVectors(queryEmbedding, 5); // Increased to 5 for better context
      console.log(`Found ${matches.length} matching emails`);
      
      if (matches.length > 0) {
        sourceEmails = matches.map((match) => match.metadata as { from: string; to: string; subject: string; date: string; body: string });
        
        // Build context from similar emails - these are examples of YOUR writing style
        context = matches.map((match) => {
          const meta = match.metadata as { from: string; to: string; subject: string; date: string; body: string };
          return `Example Email:\nFrom: ${meta.from}\nTo: ${meta.to}\nSubject: ${meta.subject}\nContent: ${meta.body}`;
        }).join('\n\n---\n\n');
        
        console.log('Context built from similar emails');
      }
    }
    
    // Generate response
    const systemPrompt = `You are an AI assistant that generates REPLY emails. Your task is to write a RESPONSE to an email that will be provided.

${context ? `CONTEXT - Previous emails showing your writing style and tone:
${context}

IMPORTANT: Study these examples carefully and mimic the writing style, tone, vocabulary, and patterns used in these emails. This helps maintain consistency with how you typically write emails.

` : ''}
INSTRUCTIONS:
1. Generate a REPLY to the email provided (do NOT reword or rewrite the original email)
2. Write as if you are responding TO the sender
3. Address their questions, concerns, or topics
4. Use a ${RESPONSE_STYLES[style as keyof typeof RESPONSE_STYLES] || RESPONSE_STYLES.professional} tone
5. ${context ? 'Match the writing style from the example emails above' : 'Write naturally and professionally'}
6. Sign off appropriately based on the context`;
    
    const userPrompt = `Please generate a reply to the following email:

${prompt}

---
Generate your REPLY below:`;
    
    console.log('Calling OpenAI for response generation...');
    console.log('System prompt length:', systemPrompt.length);
    console.log('User prompt length:', userPrompt.length);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });
    
    console.log('OpenAI response received');
    
    const response = completion.choices[0].message.content;
    
    return NextResponse.json({
      success: true,
      response,
      sourceEmails,
      style,
    });
  } catch (error) {
    console.error('Response generation error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Failed to generate response', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}