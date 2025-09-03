import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

interface User {
  id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  verify: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      
      login: async (password: string) => {
        set({ isLoading: true });
        try {
          const response = await axios.post('/api/auth/login', { password });
          const { token, user } = response.data;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          // Set default auth header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      logout: async () => {
        try {
          await axios.post('/api/auth/logout');
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
          delete axios.defaults.headers.common['Authorization'];
        }
      },
      
      verify: async () => {
        const token = get().token;
        if (!token) return;
        
        set({ isLoading: true });
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await axios.get('/api/auth/verify');
          
          if (response.data.authenticated) {
            set({
              user: response.data.user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error('Not authenticated');
          }
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
          delete axios.defaults.headers.common['Authorization'];
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);