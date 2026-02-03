import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { authApi } from '@/services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: true,

      login: async (email: string, password: string) => {
        try {
          const response = await authApi.login(email, password);
          const { user, token } = response;
          
          if (token && user) {
            localStorage.setItem('admin_token', token);
            set({ user, token, isLoading: false });
            return true;
          }
          return false;
        } catch (error) {
          set({ user: null, token: null, isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('admin_token');
        set({ user: null, token: null, isLoading: false });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
          set({ user: null, token: null, isLoading: false });
          return;
        }

        try {
          const user = await authApi.getMe();
          set({ user, token, isLoading: false });
        } catch {
          localStorage.removeItem('admin_token');
          set({ user: null, token: null, isLoading: false });
        }
      },
    }),
    {
      name: 'admin-auth',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
