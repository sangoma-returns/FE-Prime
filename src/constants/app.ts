/**
 * Application Constants
 * 
 * Centralized location for all app-wide constants, configuration values,
 * and magic numbers. This makes the codebase more maintainable and easier
 * to update.
 */

// ============================================================================
// EXCHANGE CONFIGURATION
// ============================================================================

/**
 * List of all supported exchanges
 */
export const SUPPORTED_EXCHANGES = [
  'hyperliquid',
  'paradex',
  'aster',
  'binance',
  'bybit',
  'okx',
] as const;

export type SupportedExchange = typeof SUPPORTED_EXCHANGES[number];

/**
 * Exchange display names (for UI)
 */
export const EXCHANGE_DISPLAY_NAMES: Record<SupportedExchange, string> = {
  hyperliquid: 'Hyperliquid',
  paradex: 'Paradex',
  aster: 'Aster',
  binance: 'Binance',
  bybit: 'Bybit',
  okx: 'OKX',
};

// ============================================================================
// ASSET CONFIGURATION
// ============================================================================

/**
 * List of supported assets
 */
export const SUPPORTED_ASSETS = ['USDC', 'USDT', 'ETH', 'BTC'] as const;

export type SupportedAsset = typeof SUPPORTED_ASSETS[number];

// ============================================================================
// NETWORK CONFIGURATION
// ============================================================================

/**
 * Environment network configuration (mainnet or testnet)
 */
export const VITE_NETWORK = import.meta.env.VITE_NETWORK || 'testnet';

/**
 * API Base URL based on network
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.prime.testnet.bitfrost.ai';

/**
 * Supported blockchain networks
 */
export const SUPPORTED_NETWORKS = ['HyperEVM', 'Ethereum', 'Polygon'] as const;

export type SupportedNetwork = typeof SUPPORTED_NETWORKS[number];

/**
 * Default network for deposits
 */
export const DEFAULT_DEPOSIT_NETWORK: SupportedNetwork = 'HyperEVM';

// ============================================================================
// WALLET CONFIGURATION
// ============================================================================

/**
 * WalletConnect Project ID
 * Get your project ID from https://cloud.walletconnect.com/
 * IMPORTANT: Set VITE_WALLETCONNECT_PROJECT_ID in your .env file for production
 * 
 * For development/demo purposes, a placeholder ID is provided.
 * Replace this with your actual WalletConnect Project ID in production.
 */
export const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id-replace-in-production';

// Only warn in development if using the demo project ID
if (WALLETCONNECT_PROJECT_ID === 'demo-project-id-replace-in-production' && import.meta.env.DEV) {
  console.info('ℹ️ Using demo WalletConnect Project ID. For production, set VITE_WALLETCONNECT_PROJECT_ID in your .env file.');
}

/**
 * HyperEVM Chain IDs
 */
export const HYPEREVM_MAINNET_CHAIN_ID = 999;
export const HYPEREVM_TESTNET_CHAIN_ID = 998;

/**
 * HyperEVM RPC URLs
 */
export const HYPEREVM_MAINNET_RPC = 'https://rpc.hyperliquid.xyz/evm';
export const HYPEREVM_TESTNET_RPC = 'https://rpc.hyperliquid-testnet.xyz/evm';

/**
 * HyperEVM Block Explorer URLs
 */
export const HYPEREVM_MAINNET_EXPLORER = 'https://hyperevmscan.io';
export const HYPEREVM_TESTNET_EXPLORER = 'https://hyperevm-testnet.tryethernal.com';

// ============================================================================
// ORDER CONFIGURATION
// ============================================================================

/**
 * Order types
 */
export const ORDER_TYPES = ['market', 'limit', 'twap', 'multi'] as const;

export type OrderType = typeof ORDER_TYPES[number];

/**
 * Order statuses
 */
export const ORDER_STATUSES = ['pending', 'open', 'filled', 'cancelled', 'failed'] as const;

export type OrderStatus = typeof ORDER_STATUSES[number];

// ============================================================================
// TIMEFRAMES
// ============================================================================

/**
 * Available chart timeframes
 */
export const CHART_TIMEFRAMES = ['Day', 'Week', 'Month', 'Year'] as const;

export type ChartTimeframe = typeof CHART_TIMEFRAMES[number];

// ============================================================================
// UI CONFIGURATION
// ============================================================================

/**
 * Refresh intervals (in milliseconds)
 */
export const REFRESH_INTERVALS = {
  PORTFOLIO: 30000, // 30 seconds
  FUNDING_RATES: 60000, // 1 minute
  ORDERS: 10000, // 10 seconds
  PRICE_UPDATES: 5000, // 5 seconds
} as const;

/**
 * Animation durations (in milliseconds)
 */
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

/**
 * Debounce delays (in milliseconds)
 */
export const DEBOUNCE_DELAYS = {
  SEARCH: 300,
  INPUT: 500,
  RESIZE: 150,
} as const;

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Minimum deposit amount (in USDC)
 */
export const MIN_DEPOSIT_AMOUNT = 10;

/**
 * Maximum deposit amount (in USDC)
 */
export const MAX_DEPOSIT_AMOUNT = 1000000;

/**
 * Minimum order size
 */
export const MIN_ORDER_SIZE = 0.001;

// ============================================================================
// ROUTES/PAGES
// ============================================================================

/**
 * Application pages
 * Note: Page type is defined in /hooks/useNavigation.ts to avoid duplication
 */
export const PAGES = ['portfolio', 'explore', 'aggregator', 'funding-arb', 'market-maker'] as const;

/**
 * Default page
 */
export const DEFAULT_PAGE = 'portfolio' as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

/**
 * User-facing error messages
 */
export const ERROR_MESSAGES = {
  WALLET_CONNECTION_FAILED: 'Failed to connect wallet. Please try again.',
  DEPOSIT_FAILED: 'Deposit failed. Please check your balance and try again.',
  WITHDRAWAL_FAILED: 'Withdrawal failed. Please try again.',
  ORDER_CREATION_FAILED: 'Failed to create order. Please check your inputs and try again.',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

/**
 * User-facing success messages
 */
export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: 'Wallet connected successfully',
  DEPOSIT_COMPLETED: 'Deposit completed successfully',
  WITHDRAWAL_COMPLETED: 'Withdrawal completed successfully',
  ORDER_CREATED: 'Order created successfully',
  EXCHANGES_CONFIGURED: 'Exchanges configured successfully',
} as const;

// ============================================================================
// LOCAL STORAGE KEYS
// ============================================================================

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  THEME: 'bitfrost_theme',
  SELECTED_EXCHANGES: 'bitfrost_selected_exchanges',
  USER_PREFERENCES: 'bitfrost_user_preferences',
  LAST_WALLET_ADDRESS: 'bitfrost_last_wallet_address',
} as const;

// ============================================================================
// API CONFIGURATION
// ============================================================================

/**
 * WebSocket URL
 */
export const WS_BASE_URL = process.env.REACT_APP_WS_BASE_URL || 'ws://localhost:8080';

/**
 * API timeout (in milliseconds)
 */
export const API_TIMEOUT = 30000; // 30 seconds

/**
 * Enable/disable backend authentication
 * Defaults to enabled. Set VITE_ENABLE_BACKEND_AUTH=false to disable.
 * When enabled, uses SIWE (Sign-In with Ethereum) with HTTP-only cookies.
 * When disabled or backend unavailable, gracefully degrades to wallet-only mode.
 */
export const ENABLE_BACKEND_AUTH = import.meta.env.VITE_ENABLE_BACKEND_AUTH !== 'false';