/**
 * Exchanges API Service
 * 
 * All API calls related to exchange connections, configurations,
 * and API key management.
 * 
 * API Endpoints:
 * - GET  /api/v1/exchanges - Get all supported exchanges
 * - GET  /api/v1/exchanges/:id - Get exchange details
 * - POST /api/v1/exchanges/:id/connect - Connect exchange
 * - PUT  /api/v1/exchanges/:id/disconnect - Disconnect exchange
 * - POST /api/v1/exchanges/:id/api-keys - Set API keys
 */

import { get, post, put, del } from './client';
import type { Exchange, TradingPair } from '../../types';

// ============================================================================
// EXCHANGE LIST & DETAILS
// ============================================================================

/**
 * Get all supported exchanges
 * 
 * @returns Array of all exchanges with connection status
 * @throws ApiError if request fails
 * 
 * Example:
 * ```ts
 * const exchanges = await getExchanges();
 * exchanges.forEach(ex => {
 *   console.log(`${ex.name}: ${ex.isConnected ? 'Connected' : 'Not connected'}`);
 * });
 * ```
 */
export async function getExchanges(): Promise<Exchange[]> {
  return get<Exchange[]>('/api/v1/exchanges');
}

/**
 * Get details for a specific exchange
 * 
 * @param exchangeId - Exchange ID (e.g., 'hyperliquid', 'binance')
 * @returns Exchange details including supported features
 * @throws ApiError if exchange not found
 */
export async function getExchange(exchangeId: string): Promise<Exchange> {
  return get<Exchange>(`/api/v1/exchanges/${exchangeId}`);
}

/**
 * Get user's connected exchanges
 * 
 * @returns Array of exchanges user has connected
 * @throws ApiError if request fails
 */
export async function getConnectedExchanges(): Promise<Exchange[]> {
  return get<Exchange[]>('/api/v1/exchanges/connected');
}

// ============================================================================
// EXCHANGE CONNECTION
// ============================================================================

/**
 * Connect to an exchange
 * 
 * Marks an exchange as "connected" in user's profile.
 * User must still provide API keys separately for actual trading.
 * 
 * @param exchangeId - Exchange ID to connect
 * @returns Updated exchange data
 * @throws ApiError if connection fails
 * 
 * Example:
 * ```ts
 * await connectExchange('hyperliquid');
 * // Exchange is now marked as connected
 * // User can now set API keys
 * ```
 */
export async function connectExchange(exchangeId: string): Promise<Exchange> {
  return post<Exchange>(`/api/v1/exchanges/${exchangeId}/connect`);
}

/**
 * Connect multiple exchanges at once
 * Used during onboarding flow
 * 
 * @param exchangeIds - Array of exchange IDs to connect
 * @returns Array of updated exchange data
 * @throws ApiError if any connection fails
 */
export async function connectMultipleExchanges(exchangeIds: string[]): Promise<Exchange[]> {
  return post<Exchange[]>('/api/v1/exchanges/connect-multiple', { exchangeIds });
}

/**
 * Disconnect from an exchange
 * 
 * Removes exchange connection and deletes stored API keys
 * 
 * @param exchangeId - Exchange ID to disconnect
 * @returns Confirmation
 * @throws ApiError if disconnection fails
 */
export async function disconnectExchange(exchangeId: string): Promise<{ success: boolean }> {
  return put(`/api/v1/exchanges/${exchangeId}/disconnect`);
}

// ============================================================================
// API KEY MANAGEMENT
// ============================================================================

/**
 * Set API keys for an exchange
 * 
 * IMPORTANT: API keys are encrypted and stored securely on backend.
 * Never log or store API keys in frontend code.
 * 
 * @param exchangeId - Exchange ID
 * @param apiKey - Exchange API key
 * @param apiSecret - Exchange API secret
 * @param passphrase - Optional passphrase (required for some exchanges like OKX)
 * @returns Confirmation
 * @throws ApiError if validation fails
 * 
 * Example:
 * ```ts
 * await setExchangeApiKeys('binance', 'api_key_here', 'api_secret_here');
 * // Keys are now stored and exchange is ready for trading
 * ```
 */
export async function setExchangeApiKeys(
  exchangeId: string,
  apiKey: string,
  apiSecret: string,
  passphrase?: string
): Promise<{
  success: boolean;
  apiKeySet: boolean;
}> {
  return post(`/api/v1/exchanges/${exchangeId}/api-keys`, {
    apiKey,
    apiSecret,
    passphrase,
  });
}

/**
 * Check if API keys are set for an exchange
 * 
 * @param exchangeId - Exchange ID
 * @returns Whether API keys are configured
 * @throws ApiError if request fails
 */
export async function checkApiKeysStatus(exchangeId: string): Promise<{
  apiKeySet: boolean;
  lastVerified?: string;
  isValid?: boolean;
}> {
  return get(`/api/v1/exchanges/${exchangeId}/api-keys/status`);
}

/**
 * Delete API keys for an exchange
 * 
 * @param exchangeId - Exchange ID
 * @returns Confirmation
 * @throws ApiError if deletion fails
 */
export async function deleteExchangeApiKeys(exchangeId: string): Promise<{
  success: boolean;
}> {
  return del(`/api/v1/exchanges/${exchangeId}/api-keys`);
}

/**
 * Verify API keys are valid by making a test API call
 * 
 * @param exchangeId - Exchange ID
 * @returns Validation result
 * @throws ApiError if keys are invalid
 */
export async function verifyApiKeys(exchangeId: string): Promise<{
  isValid: boolean;
  permissions: string[];
  message?: string;
}> {
  return post(`/api/v1/exchanges/${exchangeId}/api-keys/verify`);
}

// ============================================================================
// TRADING PAIRS
// ============================================================================

/**
 * Get supported trading pairs for an exchange
 * 
 * @param exchangeId - Exchange ID
 * @returns Array of trading pair symbols
 * @throws ApiError if request fails
 */
export async function getExchangePairs(exchangeId: string): Promise<string[]> {
  return get<string[]>(`/api/v1/exchanges/${exchangeId}/pairs`);
}

/**
 * Get detailed trading pair information
 * 
 * @param exchangeId - Exchange ID
 * @param pair - Trading pair symbol
 * @returns Pair details including trading limits
 * @throws ApiError if pair not found
 */
export async function getPairInfo(exchangeId: string, pair: string): Promise<TradingPair> {
  return get<TradingPair>(`/api/v1/exchanges/${exchangeId}/pairs/${pair}`);
}

/**
 * Search for trading pairs across exchanges
 * 
 * @param query - Search query (token symbol or pair name)
 * @returns Matching pairs across all exchanges
 * @throws ApiError if request fails
 */
export async function searchPairs(query: string): Promise<{
  exchange: string;
  pairs: TradingPair[];
}[]> {
  return get('/api/v1/exchanges/pairs/search', {
    params: { q: query },
  });
}

// ============================================================================
// EXCHANGE STATUS & HEALTH
// ============================================================================

/**
 * Get exchange status (uptime, maintenance, etc.)
 * 
 * @param exchangeId - Exchange ID
 * @returns Status information
 * @throws ApiError if request fails
 */
export async function getExchangeStatus(exchangeId: string): Promise<{
  status: 'online' | 'degraded' | 'offline' | 'maintenance';
  lastChecked: string;
  message?: string;
  estimatedResumeTime?: string;
}> {
  return get(`/api/v1/exchanges/${exchangeId}/status`);
}

/**
 * Get system-wide exchange health
 * 
 * @returns Health status for all exchanges
 * @throws ApiError if request fails
 */
export async function getAllExchangesStatus(): Promise<{
  exchangeId: string;
  status: 'online' | 'degraded' | 'offline' | 'maintenance';
}[]> {
  return get('/api/v1/exchanges/status/all');
}
