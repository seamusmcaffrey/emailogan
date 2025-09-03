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
  uploadProgress: number;
  uploadEmail: (file: File) => Promise<Email>;
  uploadMultipleEmails: (files: File[]) => Promise<void>;
  processEmails: (emails: Email[]) => Promise<void>;
  storeInVectorDB: (emails: Email[]) => Promise<void>;
  clearEmails: () => void;
}

export const useEmailStore = create<EmailState>((set, get) => ({
  emails: [],
  isLoading: false,
  isProcessing: false,
  uploadProgress: 0,
  
  uploadEmail: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post('/api/emails/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    const email = response.data.email;
    set((state) => ({
      emails: [...state.emails, email],
    }));
    
    return email;
  },
  
  uploadMultipleEmails: async (files: File[]) => {
    set({ isLoading: true, uploadProgress: 0 });
    
    const newEmails: Email[] = [];
    
    for (let i = 0; i < files.length; i++) {
      try {
        const email = await get().uploadEmail(files[i]);
        newEmails.push(email);
        set({ uploadProgress: ((i + 1) / files.length) * 100 });
      } catch (error) {
        console.error(`Failed to upload ${files[i].name}:`, error);
      }
    }
    
    set({ isLoading: false, uploadProgress: 100 });
    
    // Process all uploaded emails
    if (newEmails.length > 0) {
      await get().processEmails(newEmails);
    }
  },
  
  processEmails: async (emails: Email[]) => {
    set({ isProcessing: true });
    
    try {
      const response = await axios.post('/api/emails/process', { emails });
      const processedEmails = response.data.emails;
      
      // Update emails with embeddings
      set((state) => ({
        emails: state.emails.map((email) => {
          const processed = processedEmails.find((p: Email) => p.id === email.id);
          return processed ? { ...email, embedding: processed.embedding } : email;
        }),
      }));
      
      // Store in vector database
      await get().storeInVectorDB(processedEmails);
    } finally {
      set({ isProcessing: false });
    }
  },
  
  storeInVectorDB: async (emails: Email[]) => {
    await axios.post('/api/vectors/store', { emails });
  },
  
  clearEmails: () => {
    set({ emails: [], uploadProgress: 0 });
  },
}));