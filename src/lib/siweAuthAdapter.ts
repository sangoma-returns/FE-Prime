/**
 * SIWE (Sign-In with Ethereum) Authentication Adapter
 * 
 * Custom authentication adapter that handles SIWE flow without RainbowKit:
 * 1. Get nonce from backend
 * 2. Create SIWE message
 * 3. User signs message with wallet
 * 4. Verify signature on backend
 * 5. Backend sets HTTP-only cookie for session
 * 
 * Security features:
 * - Single-use nonces
 * - Message expiration (10 minutes)
 * - Domain validation
 * - HTTP-only cookies
 * - Automatic session management
 * 
 * Uses centralized authApi service for all backend calls.
 * Integrates with Zustand authStore for state management.
 */

import { logger } from '../utils/logger';
import { authApi } from './authApi';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'sonner@2.0.3';

// ============================================================================
// TYPES
// ============================================================================

interface AuthenticationAdapter {
  getNonce: () => Promise<string>;
  createMessage: (params: { 
    nonce: string; 
    address: string; 
    chainId: number; 
  }) => Promise<string>;
  verifyMessage: (params: { 
    message: string; 
    signature: string; 
  }) => Promise<boolean>;
  getSession: () => Promise<{ address: string; chainId: number } | null>;
  signOut: () => Promise<void>;
}

// ============================================================================
// SIWE MESSAGE BUILDER (without external dependencies)
// ============================================================================

/**
 * Create SIWE message string following EIP-4361 format
 * This avoids the need for the 'siwe' library and its Buffer dependency
 */
function createSiweMessage({
  domain,
  address,
  statement,
  uri,
  version,
  chainId,
  nonce,
  issuedAt,
  expirationTime,
}: {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
}): string {
  const header = `${domain} wants you to sign in with your Ethereum account:`;
  const addressLine = address;
  const statementLine = statement ? `\n${statement}` : '';
  
  const fields = [
    `\nURI: ${uri}`,
    `Version: ${version}`,
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ];
  
  if (expirationTime) {
    fields.push(`Expiration Time: ${expirationTime}`);
  }
  
  return `${header}\n${addressLine}${statementLine}\n${fields.join('\n')}`;
}

// ============================================================================
// SIWE AUTHENTICATION ADAPTER
// ============================================================================

export const siweAuthAdapter: AuthenticationAdapter = {
  /**
   * Get nonce from backend
   * Called before signing the SIWE message
   */
  getNonce: async () => {
    logger.info('[SIWE] Getting nonce from backend');
    const nonce = await authApi.getNonce();
    logger.info('[SIWE] Nonce received:', nonce);
    console.log('🔐 [SIWE] Nonce value:', nonce, '| Length:', nonce?.length);
    return nonce;
  },

  /**
   * Create SIWE message
   * Constructs the standardized EIP-4361 message to be signed
   */
  createMessage: async ({ nonce, address, chainId }) => {
    console.log('🔵 [SIWE] createMessage() called', { address, chainId });
    console.log('🔐 [SIWE] Using nonce:', nonce);
    logger.info('[SIWE] Creating message for', address);

    const message = createSiweMessage({
      domain: window.location.host,
      address,
      statement: 'Sign in to Bitfrost with Ethereum',
      uri: window.location.origin,
      version: '1',
      chainId,
      nonce,
      issuedAt: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    });
    
    console.log('📝 [SIWE] Message to sign:\n', message);
    logger.info('[SIWE] Message created');
    return message;
  },

  /**
   * Verify message with backend
   * Sends signed message and signature to backend for verification
   * Backend validates signature, nonce, and creates session with HTTP-only cookie
   */
  verifyMessage: async ({ message, signature }) => {
    console.log('🔵 [SIWE] verifyMessage() called');
    logger.info('[SIWE] Verifying signature with backend');
    
    const result = await authApi.login({ message, signature });
    
    if (result.success && result.address) {
      logger.info('[SIWE] ✅ Authentication successful', { address: result.address });
      
      // Update auth store (deferred to avoid setState during render)
      queueMicrotask(() => {
        useAuthStore.getState().setUser({ 
          address: result.address,
          user_deposited: false, // Will be updated when account data is fetched
        });
      });
      
      return true;
    }
    
    logger.error('[SIWE] ❌ Verification failed');
    toast.error('Authentication failed. Please try again.');
    return false;
  },

  /**
   * Get current session
   * Checks if user is authenticated by calling /me endpoint
   * Returns session data if authenticated, null otherwise
   * 
   * RainbowKit calls this on mount to check for existing sessions
   */
  getSession: async () => {
    console.log('🔵 [SIWE] getSession() called');
    logger.info('[SIWE] Checking for existing session');
    
    try {
      const session = await authApi.getSession();
      
      if (!session) {
        logger.info('[SIWE] No existing session');
        return null;
      }

      logger.info('[SIWE] ✅ Session found', { address: session.address });
      
      // Update auth store (deferred to avoid setState during render)
      queueMicrotask(() => {
        useAuthStore.getState().setUser({
          address: session.address,
          user_deposited: false, // Will be updated when account data is fetched
        });
      });

      return {
        address: session.address,
        chainId: 1, // Default chainId (not critical for session)
      };
    } catch (error) {
      logger.error('[SIWE] Error checking session:', error);
      return null;
    }
  },

  /**
   * Sign out
   * Calls logout endpoint to clear session cookie on backend
   */
  signOut: async () => {
    console.log('🔵 [SIWE] signOut() called');
    logger.info('[SIWE] Signing out');
    await authApi.logout();
    // Update auth store (deferred to avoid setState during render)
    queueMicrotask(() => {
      useAuthStore.getState().clearUser();
    });
    logger.info('[SIWE] ✅ Signed out successfully');
  },
};

export default siweAuthAdapter;