from pinecone import Pinecone, ServerlessSpec
from llama_index.core import VectorStoreIndex, Document
from llama_index.vector_stores.pinecone import PineconeVectorStore
from llama_index.embeddings.openai import OpenAIEmbedding
import streamlit as st
from typing import List, Dict
import os
import logging

logger = logging.getLogger(__name__)

class VectorManager:
    def __init__(self):
        self.api_key = st.secrets.get("PINECONE_API_KEY", "")
        self.index_name = "email-rag-index"
        self.embedding_model = OpenAIEmbedding(
            api_key=st.secrets.get("OPENAI_API_KEY", "")
        )
    
    def initialize_pinecone(self):
        """Initialize Pinecone connection"""
        try:
            self.pc = Pinecone(api_key=self.api_key)
            return True
        except Exception as e:
            st.error(f"Failed to initialize Pinecone: {str(e)}")
            return False
    
    def create_or_connect_index(self):
        """Create new index or connect to existing one"""
        try:
            existing_indexes = [index.name for index in self.pc.list_indexes()]
            
            if self.index_name not in existing_indexes:
                self.pc.create_index(
                    name=self.index_name,
                    dimension=1536,
                    metric='cosine',
                    spec=ServerlessSpec(
                        cloud='aws',
                        region='us-east-1'
                    )
                )
                st.success(f"✅ Created new index: {self.index_name}")
            else:
                st.info(f"📌 Connected to existing index: {self.index_name}")
            
            return self.pc.Index(self.index_name)
        except Exception as e:
            st.error(f"Index operation failed: {str(e)}")
            return None
    
    def process_emails_to_documents(self, emails: List[Dict]) -> List[Document]:
        """Convert email data to LlamaIndex Documents"""
        documents = []
        
        for email in emails:
            # Include FULL email body for better style learning
            full_body = email.get('body', '')
            
            # Create a rich document with full context
            doc_text = f"""
            === EMAIL FROM: {email['from']} ===
            To: {', '.join(email['to']) if isinstance(email['to'], list) else email['to']}
            Subject: {email['subject']}
            Date: {email['date']}
            
            === FULL EMAIL CONTENT ===
            {full_body}
            === END OF EMAIL ===
            
            Author Writing Style: {email['from']}
            This email demonstrates the unique writing style, vocabulary, and mannerisms of {email['from']}.
            """
            
            metadata = {
                'filename': email['filename'],
                'sender': email['from'],
                'subject': email['subject'],
                'date': email['date'],
                'message_id': email['message_id'],
                'body_preview': full_body[:500] if full_body else '',
                'full_body_length': len(full_body)
            }
            
            documents.append(Document(text=doc_text, metadata=metadata))
            logger.debug(f"Created document for {email['filename']} with {len(full_body)} chars of body")
        
        return documents
    
    def create_vector_store(self, emails: List[Dict]):
        """Create vector store from emails"""
        logger.info(f"Starting create_vector_store with {len(emails)} emails")
        
        with st.spinner("🔄 Creating vector embeddings..."):
            # Check for API keys first
            if not self.api_key:
                logger.error("PINECONE_API_KEY not found in secrets")
                st.error("⚠️ PINECONE_API_KEY not found in .streamlit/secrets.toml")
                st.info("You can still use Direct Context mode without Pinecone")
                return None
            
            if not st.secrets.get("OPENAI_API_KEY", ""):
                logger.error("OPENAI_API_KEY not found in secrets")
                st.error("⚠️ OPENAI_API_KEY not found in .streamlit/secrets.toml")
                return None
            
            logger.info("Initializing Pinecone...")
            if not self.initialize_pinecone():
                logger.error("Failed to initialize Pinecone")
                return None
            
            logger.info("Creating or connecting to Pinecone index...")
            pinecone_index = self.create_or_connect_index()
            if not pinecone_index:
                logger.error("Failed to create or connect to Pinecone index")
                return None
            
            logger.info(f"Processing {len(emails)} emails to documents...")
            documents = self.process_emails_to_documents(emails)
            logger.info(f"Created {len(documents)} documents")
            
            try:
                logger.info("Creating PineconeVectorStore...")
                vector_store = PineconeVectorStore(
                    pinecone_index=pinecone_index
                )
                
                logger.info("Creating VectorStoreIndex from documents...")
                index = VectorStoreIndex.from_documents(
                    documents, 
                    vector_store=vector_store,
                    embed_model=self.embedding_model,
                    show_progress=True
                )
                
                logger.info("Vector store created successfully!")
                st.success(f"✅ Successfully created vector database with {len(emails)} emails")
                return index
                
            except Exception as e:
                logger.error(f"Error creating vector store: {str(e)}", exc_info=True)
                st.error(f"Failed to create vector store: {str(e)}")
                return None