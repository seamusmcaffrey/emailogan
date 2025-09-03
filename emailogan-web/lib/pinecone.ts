import { Pinecone } from '@pinecone-database/pinecone';

let pineconeClient: Pinecone | null = null;

export async function getPineconeClient(): Promise<Pinecone> {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY || 'dummy-key-for-build';
    if (apiKey === 'dummy-key-for-build') {
      console.warn('Pinecone API key not configured');
    }
    pineconeClient = new Pinecone({
      apiKey,
    });
  }
  return pineconeClient;
}

export async function getIndex(indexName?: string) {
  const client = await getPineconeClient();
  const name = indexName || process.env.PINECONE_INDEX_NAME || 'email-rag-index';
  console.log(`📌 Using Pinecone index: ${name}`);
  return client.index(name);
}

export interface EmailVector {
  id: string;
  values: number[];
  metadata: {
    from: string;
    to: string;
    subject: string;
    date: string;
    body: string;
  };
}

export async function upsertEmailVectors(vectors: EmailVector[]) {
  const index = await getIndex();
  
  // Batch upsert for efficiency
  const batchSize = 100;
  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    await index.upsert(batch);
  }
  
  return { success: true, count: vectors.length };
}

export async function queryVectors(
  embedding: number[],
  topK: number = 5,
  filter?: Record<string, unknown>
) {
  const index = await getIndex();
  
  const queryResponse = await index.query({
    vector: embedding,
    topK,
    filter,
    includeMetadata: true,
  });
  
  return queryResponse.matches || [];
}

export async function deleteAllVectors() {
  const index = await getIndex();
  await index.deleteAll();
  return { success: true };
}

export async function getIndexStats() {
  const index = await getIndex();
  const stats = await index.describeIndexStats();
  return stats;
}