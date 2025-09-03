import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromHeaders } from '@/lib/auth';
import { queryVectors } from '@/lib/pinecone';
import OpenAI from 'openai';

export const runtime = 'nodejs';

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
    
    const { query, topK = 5, filter } = await request.json();
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }
    
    // Generate embedding for the query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query,
    });
    
    const queryEmbedding = embeddingResponse.data[0].embedding;
    
    // Search for similar vectors
    const matches = await queryVectors(queryEmbedding, topK, filter);
    
    return NextResponse.json({
      success: true,
      matches,
    });
  } catch (error) {
    console.error('Vector search error:', error);
    return NextResponse.json(
      { error: 'Failed to search vectors' },
      { status: 500 }
    );
  }
}