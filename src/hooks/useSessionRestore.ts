/**
 * Session Restore Hook - Mock Implementation
 *
 * Handles session restoration on page reload with mock wallet
 */

import { useEffect } from 'react';
import { useMockWallet } from '../contexts/MockWalletContext';
import { useAuthStore } from '../stores/authStore';
import { logger } from '../utils/logger';

export function useSessionRestore() {
  const { address, isConnected } = useMockWallet();
  const { user, status, setUser, setStatus } = useAuthStore();

  useEffect(() => {
    // Auto-restore session when wallet is connected
    if (isConnected && address && !user) {
      logger.info('Restoring session for connected wallet');
      setUser({ address });
      setStatus('authenticated');
    }

    // Clear session when wallet disconnects
    if (!isConnected && user) {
      logger.info('Clearing session - wallet disconnected');
      setUser(null);
      setStatus('unauthenticated');
    }
  }, [isConnected, address, user, setUser, setStatus]);

  return {
    isRestoring: false,
    isReady: true,
  };
}
