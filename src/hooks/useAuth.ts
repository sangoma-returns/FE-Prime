/**
 * Authentication Hook
 * 
 * Custom hook that handles SIWE authentication flow:
 * - Syncs with RainbowKit SIWE authentication
 * - Fetches user account data from backend after authentication
 * - Updates Zustand auth store with user data
 * - Handles loading and error states
 * 
 * Uses centralized authApi service for backend calls.
 * 
 * @example
 * ```tsx
 * const { fetchUserData, isLoading, error } = useAuth();
 * 
 * // Fetch user data after SIWE authentication
 * useEffect(() => {
 *   if (isAuthenticated) {
 *     fetchUserData();
 *   }
 * }, [isAuthenticated]);
 * ```
 */

import { useCallback, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../lib/authApi';
import { logger } from '../utils/logger';

// ============================================================================
// HOOK
// ============================================================================

export function useAuth() {
  const { user, setUser, clearUser, setLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch user account data from backend
   * Called after SIWE authentication to get additional user info
   */
  const fetchUserData = useCallback(async () => {
    if (!user?.address) {
      logger.warn('[useAuth] No user address available');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      logger.info('[useAuth] Fetching user account data', { address: user.address });

      const data = await authApi.getAccount();

      // Update user with account data
      const hasDeposited = parseFloat(data.account.unlocked) > 0 || parseFloat(data.account.locked) > 0;

      setUser({
        ...user,
        address: data.account.address,
        user_deposited: hasDeposited,
      });

      logger.info('[useAuth] User account data fetched', {
        address: data.account.address,
        hasDeposited,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user data';
      setError(errorMessage);
      logger.error('[useAuth] Failed to fetch user data', err);
    } finally {
      setLoading(false);
    }
  }, [user, setUser, setLoading]);

  /**
   * Handle logout
   * This is called when user disconnects wallet
   * SIWE adapter handles the backend logout automatically
   */
  const handleLogout = useCallback(async () => {
    try {
      logger.info('[useAuth] Logging out');
      clearUser();
    } catch (err) {
      logger.error('[useAuth] Logout error', err);
      // Clear user data even if there's an error
      clearUser();
    }
  }, [clearUser]);

  return {
    fetchUserData,
    handleLogout,
    error,
  };
}

export default useAuth;