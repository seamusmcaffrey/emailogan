import { create } from 'zustand';
import axios from 'axios';

interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  date: Date;
  body: string;
  embedding?: number[];
}

interface EmailState {
  emails: Email[];
  isLoading: boolean;
  isProcessing: boolean;
  isStoringVectors: boolean;
  uploadProgress: number;
  uploadEmail: (file: File) => Promise<Email>;
  uploadMultipleEmails: (files: File[]) => Promise<void>;
  processEmails: (emails: Email[]) => Promise<void>;
  storeInVectorDB: (emails: Email[]) => Promise<void>;
  clearEmails: () => void;
  fetchEmailsFromVectorDB: () => Promise<void>;
  clearKnowledgeBase: () => Promise<void>;
}

export const useEmailStore = create<EmailState>((set, get) => ({
  emails: [],
  isLoading: false,
  isProcessing: false,
  isStoringVectors: false,
  uploadProgress: 0,
  
  uploadEmail: async (file: File) => {
    console.log(`📤 Uploading single email: ${file.name} (${file.size} bytes)`);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      console.log('🌐 Sending to /api/emails/upload...');
      const response = await axios.post('/api/emails/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = progressEvent.total 
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          console.log(`📊 Upload progress for ${file.name}: ${percentCompleted}%`);
        },
      });
      
      console.log('✅ Upload response:', response.data);
      const email = response.data.email;
      set((state) => ({
        emails: [...state.emails, email],
      }));
      
      return email;
    } catch (error: any) {
      console.error(`❌ Upload failed for ${file.name}:`, error.response?.data || error.message);
      throw error;
    }
  },
  
  uploadMultipleEmails: async (files: File[]) => {
    console.log(`🚀 Starting batch upload of ${files.length} files`);
    set({ isLoading: true, uploadProgress: 0 });
    
    const newEmails: Email[] = [];
    
    for (let i = 0; i < files.length; i++) {
      try {
        console.log(`📁 Processing file ${i + 1}/${files.length}: ${files[i].name}`);
        const email = await get().uploadEmail(files[i]);
        newEmails.push(email);
        const progress = ((i + 1) / files.length) * 100;
        console.log(`✨ Progress: ${progress.toFixed(1)}%`);
        set({ uploadProgress: progress });
      } catch (error: any) {
        console.error(`❌ Failed to upload ${files[i].name}:`, error.message);
      }
    }
    
    console.log(`✅ Uploaded ${newEmails.length}/${files.length} emails successfully`);
    set({ isLoading: false, uploadProgress: 100 });
    
    // Process all uploaded emails
    if (newEmails.length > 0) {
      console.log('🔄 Starting email processing...');
      await get().processEmails(newEmails);
    } else {
      console.warn('⚠️ No emails were successfully uploaded');
    }
  },
  
  processEmails: async (emails: Email[]) => {
    console.log(`🔬 Processing ${emails.length} emails for embeddings...`);
    set({ isProcessing: true });
    
    try {
      console.log('🌐 Sending to /api/emails/process...');
      const response = await axios.post('/api/emails/process', { emails });
      console.log('✅ Process response:', response.data);
      const processedEmails = response.data.emails;
      
      // Update emails with embeddings
      console.log(`📝 Updating ${processedEmails.length} emails with embeddings`);
      set((state) => ({
        emails: state.emails.map((email) => {
          const processed = processedEmails.find((p: Email) => p.id === email.id);
          return processed ? { ...email, embedding: processed.embedding } : email;
        }),
      }));
      
      // Store in vector database
      console.log('💾 Storing in vector database...');
      await get().storeInVectorDB(processedEmails);
    } catch (error: any) {
      console.error('❌ Processing failed:', error.response?.data || error.message);
      if (error.response?.data?.details) {
        console.error('📋 Error details:', error.response.data.details);
      }
      throw error;
    } finally {
      set({ isProcessing: false });
      console.log('✨ Email processing completed');
    }
  },
  
  storeInVectorDB: async (emails: Email[]) => {
    console.log(`🗄️ Storing ${emails.length} emails in vector database...`);
    set({ isStoringVectors: true });
    try {
      const response = await axios.post('/api/vectors/store', { emails });
      console.log('✅ Vector storage response:', response.data);
    } catch (error: any) {
      console.error('❌ Vector storage failed:', error.response?.data || error.message);
      throw error;
    } finally {
      set({ isStoringVectors: false });
    }
  },
  
  clearEmails: () => {
    set({ emails: [], uploadProgress: 0 });
  },
  
  fetchEmailsFromVectorDB: async () => {
    console.log('🔍 Fetching emails from vector database...');
    set({ isLoading: true });
    
    try {
      const response = await axios.get('/api/vectors/list');
      console.log(`✅ Fetched ${response.data.emails.length} emails from vector database`);
      
      set({ 
        emails: response.data.emails,
        isLoading: false 
      });
    } catch (error: any) {
      console.error('❌ Failed to fetch emails from vector database:', error.message);
      set({ isLoading: false });
    }
  },
  
  clearKnowledgeBase: async () => {
    console.log('🗑️ Clearing entire knowledge base...');
    set({ isLoading: true });
    
    try {
      const response = await axios.delete('/api/vectors/clear');
      console.log('✅ Knowledge base cleared:', response.data.message);
      
      // Clear local state after successful deletion
      set({ 
        emails: [],
        isLoading: false,
        uploadProgress: 0 
      });
    } catch (error: any) {
      console.error('❌ Failed to clear knowledge base:', error.message);
      set({ isLoading: false });
      throw error;
    }
  },
}));