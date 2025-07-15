import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNameSync } from '../useNameSync';
import { useAuth } from '../useAuthContext';
import type { AuthContextType } from '../../contexts/AuthContext';

// Mock useAuth hook
vi.mock('../useAuthContext', () => ({
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

describe('useNameSync', () => {
  const mockGetAccessToken = vi.fn();
  const mockUser = {
    sub: 'auth0|123',
    given_name: 'John',
    family_name: 'Doe',
    name: 'John Doe',
    email: 'john.doe@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue(
      createMockAuthContext({
        getAccessToken: mockGetAccessToken,
        user: mockUser,
        isAuthenticated: true,
      }),
    );
  });

  describe('initialization', () => {
    it('should initialize with isLoading false', () => {
      const { result } = renderHook(() => useNameSync());

      expect(result.current.isLoading).toBe(false);
      expect(typeof result.current.forceNameSync).toBe('function');
      expect(typeof result.current.extractNamesFromAuth0).toBe('function');
    });
  });

  describe('forceNameSync', () => {
    it('should successfully sync names when token is available', async () => {
      mockGetAccessToken.mockResolvedValue('mock-token');

      const { result } = renderHook(() => useNameSync());

      let syncResult:
        | {
            success: boolean;
            message?: string;
            firstName?: string;
            lastName?: string;
            error?: string;
          }
        | undefined;
      await act(async () => {
        syncResult = await result.current.forceNameSync();
      });

      expect(syncResult).toEqual({
        success: true,
        message: 'Name sync successful',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle missing authentication token', async () => {
      mockGetAccessToken.mockResolvedValue(null);

      const { result } = renderHook(() => useNameSync());

      let syncResult:
        | {
            success: boolean;
            message?: string;
            firstName?: string;
            lastName?: string;
            error?: string;
          }
        | undefined;
      await act(async () => {
        syncResult = await result.current.forceNameSync();
      });

      expect(syncResult).toEqual({
        success: false,
        error: 'No authentication token available',
      });
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle token retrieval errors', async () => {
      mockGetAccessToken.mockRejectedValue(new Error('Token fetch failed'));

      const { result } = renderHook(() => useNameSync());

      let syncResult:
        | {
            success: boolean;
            message?: string;
            firstName?: string;
            lastName?: string;
            error?: string;
          }
        | undefined;
      await act(async () => {
        syncResult = await result.current.forceNameSync();
      });

      expect(syncResult).toEqual({
        success: false,
        error: 'Token fetch failed',
      });
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle unknown errors', async () => {
      mockGetAccessToken.mockRejectedValue('Unknown error');

      const { result } = renderHook(() => useNameSync());

      let syncResult:
        | {
            success: boolean;
            message?: string;
            firstName?: string;
            lastName?: string;
            error?: string;
          }
        | undefined;
      await act(async () => {
        syncResult = await result.current.forceNameSync();
      });

      expect(syncResult).toEqual({
        success: false,
        error: 'Unknown error',
      });
    });

    it('should set loading state correctly during sync', async () => {
      mockGetAccessToken.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve('token'), 100)),
      );

      const { result } = renderHook(() => useNameSync());

      act(() => {
        result.current.forceNameSync();
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('extractNamesFromAuth0', () => {
    it('should extract names from given_name and family_name', () => {
      const { result } = renderHook(() => useNameSync());

      const names = result.current.extractNamesFromAuth0();

      expect(names).toEqual({
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    it('should handle missing given_name and family_name by parsing full name', () => {
      mockUseAuth.mockReturnValue(
        createMockAuthContext({
          getAccessToken: mockGetAccessToken,
          user: {
            sub: 'auth0|123',
            name: 'Jane Smith Wilson',
            email: 'jane@example.com',
          },
          isAuthenticated: true,
        }),
      );

      const { result } = renderHook(() => useNameSync());

      const names = result.current.extractNamesFromAuth0();

      expect(names).toEqual({
        firstName: 'Jane',
        lastName: 'Smith Wilson',
      });
    });

    it('should handle single name', () => {
      mockUseAuth.mockReturnValue(
        createMockAuthContext({
          getAccessToken: mockGetAccessToken,
          user: {
            sub: 'auth0|123',
            name: 'Madonna',
            email: 'madonna@example.com',
          },
          isAuthenticated: true,
        }),
      );

      const { result } = renderHook(() => useNameSync());

      const names = result.current.extractNamesFromAuth0();

      expect(names).toEqual({
        firstName: 'Madonna',
        lastName: '',
      });
    });

    it('should return empty strings when user is null', () => {
      mockUseAuth.mockReturnValue(
        createMockAuthContext({
          getAccessToken: mockGetAccessToken,
          user: null,
          isAuthenticated: false,
        }),
      );

      const { result } = renderHook(() => useNameSync());

      const names = result.current.extractNamesFromAuth0();

      expect(names).toEqual({
        firstName: '',
        lastName: '',
      });
    });

    it('should handle empty name fields', () => {
      mockUseAuth.mockReturnValue(
        createMockAuthContext({
          getAccessToken: mockGetAccessToken,
          user: {
            sub: 'auth0|123',
            email: 'user@example.com',
          },
          isAuthenticated: true,
        }),
      );

      const { result } = renderHook(() => useNameSync());

      const names = result.current.extractNamesFromAuth0();

      expect(names).toEqual({
        firstName: '',
        lastName: '',
      });
    });
  });
});
