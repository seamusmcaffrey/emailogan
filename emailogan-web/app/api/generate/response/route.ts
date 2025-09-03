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
        context = matches.map((match, index) => {
          const meta = match.metadata as { from: string; to: string; subject: string; date: string; body: string };
          console.log(`Similar email #${index + 1} (score: ${match.score}):`);
          console.log(`  Subject: ${meta.subject?.substring(0, 50)}...`);
          console.log(`  Body preview: ${meta.body?.substring(0, 100)}...`);
          return `Example Email #${index + 1}:\nFrom: ${meta.from}\nTo: ${meta.to}\nSubject: ${meta.subject}\nContent: ${meta.body}`;
        }).join('\n\n---\n\n');
        
        console.log('Context built from similar emails');
        console.log(`Total context length: ${context.length} characters`);
      }
    }
    
    // Generate response
    const systemPrompt = context 
      ? `You are an AI assistant that MUST closely mimic a specific writing style.

CRITICAL INSTRUCTIONS - YOUR PRIMARY TASK:
You MUST generate email responses that EXACTLY match the writing style, vocabulary, tone, and patterns shown in the example emails below. These examples represent how the user typically writes emails, and you must emulate their unique voice.

EXAMPLE EMAILS FROM THE USER (STUDY THESE CAREFULLY):
${context}

STYLE MIMICRY REQUIREMENTS - ANALYZE AND REPLICATE:
- Vocabulary: Look for unique word choices, technical terms, and specific phrases
- Tone: Is it formal/informal, logical/emotional, technical/casual?
- Structure: How are sentences constructed? Short/long? Complex/simple?
- Personality markers: Any unique expressions, catchphrases, or distinctive patterns?
- Data usage: Do they cite statistics, percentages, probabilities?
- Greetings/closings: Exact patterns used for opening and signing off
- Reasoning style: How are arguments presented? Logical? Analytical? Emotional?
- Cultural or professional references: Any domain-specific knowledge displayed?

CRITICAL: Your response MUST sound like it was written by the SAME PERSON who wrote the example emails

TASK:
Generate a REPLY to an email that will be provided, but write it EXACTLY in the style demonstrated above.
The tone should be ${RESPONSE_STYLES[style as keyof typeof RESPONSE_STYLES] || RESPONSE_STYLES.professional} while still maintaining the unique voice from the examples.`
      : `You are an AI assistant that generates professional email replies.

INSTRUCTIONS:
Generate a REPLY to the email provided using a ${RESPONSE_STYLES[style as keyof typeof RESPONSE_STYLES] || RESPONSE_STYLES.professional} tone.
Write naturally and professionally.`;
    
    const userPrompt = `Please generate a reply to the following email:

${prompt}

---
Remember: ${context ? 'You MUST write in the exact style shown in the example emails above.' : 'Write a professional response.'}
Generate your REPLY below:`;
    
    console.log('Calling OpenAI for response generation...');
    console.log('Using model: gpt-5');
    console.log('System prompt length:', systemPrompt.length);
    console.log('User prompt length:', userPrompt.length);
    
    // Add verbose logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('--- FULL SYSTEM PROMPT ---');
      console.log(systemPrompt);
      console.log('--- END SYSTEM PROMPT ---');
      console.log('--- FULL USER PROMPT ---');
      console.log(userPrompt);
      console.log('--- END USER PROMPT ---');
    }
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-5',
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