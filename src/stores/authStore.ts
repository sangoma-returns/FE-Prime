/**
 * Authentication Store (Zustand)
 * 
 * Manages authentication state and user information.
 * Works with HTTP-only cookie authentication from the backend.
 * 
 * State:
 * - isAuthenticated: Whether user is logged in
 * - user: User information (user_deposited flag, etc.)
 * - isLoading: Loading state during auth operations
 * - status: Authentication status from SIWE
 * 
 * Actions:
 * - setUser: Set user info and authenticated state
 * - clearUser: Clear user info and logout
 * - setLoading: Set loading state
 * - setStatus: Set authentication status
 * 
 * @example
 * ```tsx
 * const { isAuthenticated, user, setUser, clearUser } = useAuthStore();
 * 
 * // After login
 * setUser({ user_deposited: true });
 * 
 * // After logout
 * clearUser();
 * ```
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// TYPES
// ============================================================================

/**
 * User information from backend
 */
export interface User {
  /** Wallet address */
  address: string;
  /** Whether user has deposited funds */
  user_deposited?: boolean;
  /** Session expiration */
  expiresAt?: string;
  // Add more user fields as needed from your backend
}

/**
 * Authentication state shape
 */
interface AuthState {
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** User information */
  user: User | null;
  /** Loading state for auth operations */
  isLoading: boolean;
  /** Authentication status from SIWE */
  status: 'loading' | 'authenticated' | 'unauthenticated';
}

/**
 * Authentication actions
 */
interface AuthActions {
  /** Set user info and mark as authenticated */
  setUser: (user: User) => void;
  /** Clear user info and mark as not authenticated */
  clearUser: () => void;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
  /** Set authentication status */
  setStatus: (status: 'loading' | 'authenticated' | 'unauthenticated') => void;
}

// ============================================================================
// STORE
// ============================================================================

/**
 * Authentication store
 */
export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    (set) => ({
      // Initial state
      isAuthenticated: false,
      user: null,
      isLoading: false,
      status: 'loading', // Start with loading while checking for existing session

      // Actions
      setUser: (user: User) =>
        set(
          { 
            user, 
            isAuthenticated: true,
            isLoading: false,
            status: 'authenticated',
          },
          false,
          'auth/setUser'
        ),

      clearUser: () =>
        set(
          { 
            user: null, 
            isAuthenticated: false,
            isLoading: false,
            status: 'unauthenticated',
          },
          false,
          'auth/clearUser'
        ),

      setLoading: (loading: boolean) =>
        set(
          { isLoading: loading },
          false,
          'auth/setLoading'
        ),

      setStatus: (status: 'loading' | 'authenticated' | 'unauthenticated') =>
        set(
          { status: status },
          false,
          'auth/setStatus'
        ),
    }),
    { name: 'AuthStore' }
  )
);

export default useAuthStore;