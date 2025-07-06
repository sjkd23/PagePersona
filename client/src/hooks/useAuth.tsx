import { useState, useContext, createContext, useEffect } from 'react';
import type { ReactNode } from 'react';

// Types
interface User {
  _id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'user' | 'admin';
  isEmailVerified: boolean;
  preferences: {
    theme: 'light' | 'dark';
    language: string;
    notifications: boolean;
  };
  usage: {
    totalTransformations: number;
    monthlyTransformations: number;
    lastTransformationDate?: Date;
  };
  createdAt: Date;
  lastLoginAt?: Date;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (login: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  clearError: () => void;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

// Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth API functions
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const authAPI = {
  async login(login: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ login, password }),
    });
    return response.json();
  },

  async register(data: RegisterData) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async getProfile(token: string) {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  async updateProfile(token: string, data: Partial<User>) {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  }
};

// Auth Provider Component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user profile on mount if token exists
  useEffect(() => {
    if (token) {
      loadUserProfile();
    }
  }, [token]);

  const loadUserProfile = async () => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      const response = await authAPI.getProfile(token);
      
      if (response.success) {
        setUser(response.user);
      } else {
        // Token might be invalid
        logout();
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (login: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authAPI.login(login, password);
      
      if (response.success) {
        setToken(response.token);
        setUser(response.user);
        localStorage.setItem('auth_token', response.token);
        return { success: true };
      } else {
        setError(response.error || 'Login failed');
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = 'Network error. Please check your connection.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authAPI.register(data);
      
      if (response.success) {
        setToken(response.token);
        setUser(response.user);
        localStorage.setItem('auth_token', response.token);
        return { success: true };
      } else {
        setError(response.error || 'Registration failed');
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = 'Network error. Please check your connection.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem('auth_token');
  };

  const clearError = () => {
    setError(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authAPI.updateProfile(token, data);
      
      if (response.success) {
        setUser(response.user);
        return { success: true };
      } else {
        setError(response.error || 'Update failed');
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = 'Network error. Please check your connection.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// useAuth hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
