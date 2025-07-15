/**
 * Auth Context Definition
 *
 * Contains the Auth context definition to comply with React Fast Refresh
 * requirements that separate contexts from components.
 */

import { createContext } from 'react';
import type { User } from '@auth0/auth0-react';
import type { UserProfile } from '../utils/userSync';

interface CustomClaims {
  'https://pagepersona.com/is_new_user'?: boolean;
  'https://pagepersona.com/first_login'?: boolean;
  'https://pagepersona.com/profile_created_at'?: string;
  'https://pagepersona.com/profile_sync_error'?: boolean;
}

export interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  login: () => void;
  logout: () => void;
  signup: () => void;
  getAccessToken: () => Promise<string | undefined>;
  refreshUserProfile: () => Promise<void>;
  isNewUser: boolean | null;
  isFirstLogin: boolean | null;
  profileSyncError: boolean | null;
  getCustomClaims: () => Promise<CustomClaims | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export type { CustomClaims };
