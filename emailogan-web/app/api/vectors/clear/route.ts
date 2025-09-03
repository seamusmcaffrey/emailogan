import { NextRequest, NextResponse } from 'next/server';
import { getPineconeClient } from '@/lib/pinecone';

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Clearing all vectors from Pinecone...');
    
    const pinecone = await getPineconeClient();
    const index = pinecone.index('email-rag-index');
    
    // Delete all vectors by namespace or deleteAll
    await index.deleteAll();
    
    console.log('✅ Successfully cleared all vectors from Pinecone');
    
    return NextResponse.json({ 
      success: true,
      message: 'All vectors have been cleared from the knowledge base' 
    });
  } catch (error: any) {
    console.error('❌ Failed to clear vectors:', error);
    return NextResponse.json(
      { error: 'Failed to clear vectors', details: error.message },
      { status: 500 }
    );
  }
}