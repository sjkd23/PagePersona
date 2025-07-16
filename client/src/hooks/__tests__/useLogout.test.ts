import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLogout } from '../useLogout';
import { useAuth } from '../useAuth';
import type { AuthContextType } from '../../contexts/AuthContext';

// Mock useAuth hook
vi.mock('../useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

const createMockAuthContext = (overrides: Partial<AuthContextType> = {}): AuthContextType => ({
  getAccessToken: vi.fn(),
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: vi.fn(),
  logout: vi.fn(),
  signup: vi.fn(),
  refreshUserProfile: vi.fn(),
  getCustomClaims: vi.fn(),
  userProfile: null,
  isSyncing: false,
  isNewUser: null,
  isFirstLogin: null,
  profileSyncError: null,
  ...overrides,
});

describe('useLogout', () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue(
      createMockAuthContext({
        logout: mockLogout,
      }),
    );
  });

  describe('logout functionality', () => {
    it('should provide logout function', () => {
      const { result } = renderHook(() => useLogout());

      expect(typeof result.current.logout).toBe('function');
    });

    it('should call the auth logout function when logout is called', () => {
      const { result } = renderHook(() => useLogout());

      act(() => {
        result.current.logout();
      });

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('should call logout multiple times if called multiple times', () => {
      const { result } = renderHook(() => useLogout());

      act(() => {
        result.current.logout();
        result.current.logout();
        result.current.logout();
      });

      expect(mockLogout).toHaveBeenCalledTimes(3);
    });

    it('should maintain stable logout function reference', () => {
      const { result, rerender } = renderHook(() => useLogout());

      const firstLogout = result.current.logout;

      rerender();

      const secondLogout = result.current.logout;

      expect(firstLogout).toBe(secondLogout);
    });
  });
});
