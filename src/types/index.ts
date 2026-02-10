/**
 * Shared TypeScript type definitions for the application
 * 
 * This file contains all interfaces and types used across the app.
 * Keep this file updated as new data structures are added.
 */

// ============================================================================
// USER & AUTHENTICATION
// ============================================================================

export interface User {
  id: string;
  walletAddress: string;
  createdAt: string;
  lastLogin: string;
}

export interface WalletConnection {
  address: string;
  chainId: number;
  isConnected: boolean;
  provider: 'metamask' | 'walletconnect' | 'coinbase';
}

// ============================================================================
// PORTFOLIO
// ============================================================================

export interface PortfolioSummary {
  totalEquity: number;
  totalEquityChange24h: number;
  totalEquityChangePercent24h: number;
  directionalBias: number;
  directionalBiasPercent: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  currency: 'USD' | 'USDC' | 'USDT';
}

export interface ExchangeBalance {
  exchangeId: string;
  exchangeName: string;
  balance: number;
  lockedBalance: number;
  availableBalance: number;
  positions: Position[];
  isConnected: boolean;
  lastUpdated: string;
}

export interface Position {
  id: string;
  pair: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  leverage: number;
  liquidationPrice: number;
}

// ============================================================================
// ORDERS
// ============================================================================

export interface Order {
  id: string;
  userId: string;
  type: 'market' | 'limit' | 'twap' | 'multi' | 'single';
  status: 'pending' | 'open' | 'filled' | 'cancelled' | 'failed';
  buyExchange: string;
  buyPair: string;
  buyQuantity: number;
  buyPrice?: number;
  sellExchange: string;
  sellPair: string;
  sellQuantity: number;
  sellPrice?: number;
  duration?: string;
  strategy?: string;
  createdAt: string;
  updatedAt: string;
  executedAt?: string;
  fills?: OrderFill[];
}

export interface OrderFill {
  id: string;
  orderId: string;
  exchange: string;
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  fee: number;
  timestamp: string;
}

export interface CreateOrderRequest {
  type?: 'market' | 'limit' | 'twap' | 'multi' | 'vwap' | 'iceberg' | 'single';
  buyExchange?: string;
  buyPair?: string;
  buyQuantity?: number;
  buyPrice?: number;
  sellExchange?: string;
  sellPair?: string;
  sellQuantity?: number;
  sellPrice?: number;
  duration?: string;
  strategy?: string;
  
  // Aggregator-specific fields
  side?: 'buy' | 'sell';
  token?: string;
  amount?: number;
  exchanges?: string[];
  twapConfig?: {
    duration: number;
    orders: number;
  };
}

// ============================================================================
// FUNDING RATES
// ============================================================================

export interface FundingRate {
  token: string;
  symbol: string;
  exchanges: {
    [exchangeId: string]: FundingRateData | null;
  };
  lastUpdated: string;
}

export interface FundingRateData {
  rate: number;
  rateAnnualized: number;
  nextFundingTime: string;
  indexPrice: number;
  markPrice: number;
}

export interface FundingRateHistorical {
  token: string;
  exchange: string;
  timestamp: string;
  rate: number;
  rateAnnualized: number;
}

// ============================================================================
// EXCHANGES
// ============================================================================

export interface Exchange {
  id: string;
  name: string;
  displayName: string;
  isEnabled: boolean;
  isConnected: boolean;
  apiKeySet: boolean;
  supportedPairs: string[];
  features: {
    spot: boolean;
    futures: boolean;
    perpetuals: boolean;
  };
}

export interface TradingPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  exchange: string;
  minOrderSize: number;
  maxOrderSize: number;
  priceDecimals: number;
  quantityDecimals: number;
  isActive: boolean;
}

// ============================================================================
// DEPOSITS & WITHDRAWALS
// ============================================================================

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal';
  asset: 'USDC' | 'USDT' | 'ETH';
  amount: number;
  network: 'HyperEVM' | 'Ethereum' | 'Polygon';
  status: 'pending' | 'confirmed' | 'failed';
  txHash?: string;
  createdAt: string;
  confirmedAt?: string;
}

export interface DepositRequest {
  amount: number;
  asset: 'USDC' | 'USDT';
  network: 'HyperEVM';
}

export interface WithdrawalRequest {
  amount: number;
  asset: 'USDC' | 'USDT';
  network: 'HyperEVM';
  destinationAddress: string;
}

// ============================================================================
// TRADE HISTORY
// ============================================================================

export interface Trade {
  id: string;
  orderId: string;
  pair: string;
  side: 'buy' | 'sell' | 'multi';
  exchange: string;
  price: number;
  quantity: number;
  total: number;
  fee: number;
  feeAsset: string;
  status: 'pending' | 'filled' | 'cancelled' | 'finished';
  strategy?: string;
  filledPercent: number;
  timestamp: string;
}

export interface TradeHistoryFilters {
  pair?: string;
  exchange?: string;
  side?: 'buy' | 'sell' | 'multi';
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// WEBSOCKET MESSAGES
// ============================================================================

export interface WebSocketMessage {
  type: 'price_update' | 'funding_rate_update' | 'order_update' | 'balance_update';
  data: any;
  timestamp: string;
}

export interface PriceUpdate {
  symbol: string;
  exchange: string;
  price: number;
  change24h: number;
  volume24h: number;
  timestamp: string;
}

export interface FundingRateUpdate {
  token: string;
  exchange: string;
  rate: number;
  rateAnnualized: number;
  nextFundingTime: string;
  timestamp: string;
}

// ============================================================================
// UI STATE (for Context/Store)
// ============================================================================

export interface AppState {
  user: User | null;
  wallet: WalletConnection | null;
  portfolio: PortfolioSummary | null;
  selectedExchanges: string[];
  theme: 'light' | 'dark';
  isLoading: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const SUPPORTED_EXCHANGES = [
  'hyperliquid',
  'paradex',
  'aster',
  'binance',
  'bybit',
  'okx',
] as const;

export type SupportedExchange = typeof SUPPORTED_EXCHANGES[number];

export const SUPPORTED_ASSETS = ['USDC', 'USDT', 'ETH', 'BTC'] as const;
export type SupportedAsset = typeof SUPPORTED_ASSETS[number];