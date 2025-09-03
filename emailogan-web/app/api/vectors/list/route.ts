import { NextRequest, NextResponse } from 'next/server';
import { getPineconeClient } from '@/lib/pinecone';

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching all vectors from Pinecone...');
    
    const pinecone = await getPineconeClient();
    const index = pinecone.index('email-rag-index');
    
    // Query with a dummy vector to get all results
    // Using a zero vector and high topK to retrieve all emails
    const queryResponse = await index.query({
      vector: new Array(1536).fill(0),
      topK: 10000, // Get up to 10000 vectors
      includeMetadata: true,
    });
    
    console.log(`✅ Found ${queryResponse.matches?.length || 0} vectors in Pinecone`);
    
    // Transform Pinecone results to email format
    const emails = queryResponse.matches?.map((match: any) => ({
      id: match.id,
      from: match.metadata?.sender || '',
      to: match.metadata?.to || '',
      subject: match.metadata?.subject || '',
      date: match.metadata?.date ? new Date(match.metadata.date) : new Date(),
      body: match.metadata?.body_preview || '',
      embedding: match.values || undefined,
    })) || [];
    
    return NextResponse.json({ 
      emails,
      count: emails.length 
    });
  } catch (error: any) {
    console.error('❌ Failed to fetch vectors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vectors', details: error.message },
      { status: 500 }
    );
  }
}