import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { loginUser as apiLoginUser, registerUser as apiRegisterUser, getUserProfile } from '../api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (username: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  getProfile: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
      error: null,

      login: async (username, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiLoginUser({ username, password });
          const isAdmin = response.roles?.includes('ADMIN') || false;
          
          set({ 
            user: response, 
            token: response.token, 
            isAuthenticated: true,
            isAdmin,
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Login failed. Please check your credentials.', 
            isLoading: false,
            isAuthenticated: false,
            isAdmin: false
          });
          throw error;
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          console.log('Registering user with data:', userData);
          const response = await apiRegisterUser(userData);
          console.log('Registration response:', response);
          const isAdmin = response.roles?.includes('ADMIN') || false;
          
          set({ 
            user: response, 
            token: response.token, 
            isAuthenticated: true,
            isAdmin,
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          console.error('Registration error details:', error);
          
          // Improved error handling with detailed error messages
          let errorMsg = 'Registration failed. Please try again.';
          
          if (error.response?.data) {
            // Handle structured validation errors
            if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
              // Join all error messages
              errorMsg = error.response.data.errors
                .map((err: any) => `${err.path}: ${err.message}`)
                .join('. ');
            } 
            // Handle simple error message
            else if (error.response.data.message) {
              errorMsg = error.response.data.message;
            }
            // Additional context based on status
            if (error.response.status === 409) {
              errorMsg = 'Username or email already exists. Please try different credentials.';
            } else if (error.response.status === 400) {
              errorMsg = error.response.data.message || 'Invalid registration data. Please check your inputs.';
            }
          }
          
          console.error('Setting error message:', errorMsg);
          set({ 
            error: errorMsg, 
            isLoading: false 
          });
          throw error;
        }
      },

      logout: () => {
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          isAdmin: false,
          error: null 
        });
      },

      getProfile: async () => {
        const { token } = get();
        if (!token) return;

        set({ isLoading: true });
        try {
          const userData = await getUserProfile();
          const isAdmin = userData.roles?.includes('ADMIN') || false;
          
          set({ 
            user: userData, 
            isAuthenticated: true,
            isAdmin,
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Failed to get user profile', 
            isLoading: false 
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated, isAdmin: state.isAdmin }),
    }
  )
); 