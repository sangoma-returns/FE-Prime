/**
 * Orders API Service
 * 
 * All API calls related to order creation, management, and execution.
 * Handles market orders, limit orders, TWAP orders, and multi-leg arbitrage orders.
 * 
 * API Endpoints:
 * - POST /api/v1/orders - Create new order
 * - GET  /api/v1/orders/:id - Get order details
 * - GET  /api/v1/orders - Get user's orders
 * - PUT  /api/v1/orders/:id/cancel - Cancel order
 * - GET  /api/v1/orders/:id/status - Get order status
 */

import { get, post, put, del } from './client';
import type { Order, CreateOrderRequest, OrderFill, Trade, TradeHistoryFilters, PaginatedResponse } from '../../types';

// ============================================================================
// ORDER CREATION
// ============================================================================

/**
 * Create a new order
 * 
 * Supports multiple order types:
 * - market: Execute immediately at current market price
 * - limit: Execute at specified price or better
 * - twap: Time-weighted average price execution over duration
 * - multi: Multi-leg arbitrage order (buy on one exchange, sell on another)
 * 
 * @param orderData - Order parameters
 * @returns Created order with ID and status
 * @throws ApiError if validation fails or order creation fails
 * 
 * Example - Multi-leg arbitrage:
 * ```ts
 * const order = await createOrder({
 *   type: 'multi',
 *   buyExchange: 'hyperliquid',
 *   buyPair: 'BTC-PERP-USDC',
 *   buyQuantity: 0.5,
 *   sellExchange: 'binance',
 *   sellPair: 'BTCUSDT',
 *   sellQuantity: 0.5,
 *   duration: '1h',
 *   strategy: 'TWAP'
 * });
 * ```
 */
export async function createOrder(orderData: CreateOrderRequest): Promise<Order> {
  return post<Order>('/api/v1/orders', orderData);
}

/**
 * Create multiple orders in a batch
 * Useful for complex arbitrage strategies
 * 
 * @param orders - Array of order requests
 * @returns Array of created orders
 * @throws ApiError if any order fails validation
 */
export async function createBatchOrders(orders: CreateOrderRequest[]): Promise<Order[]> {
  return post<Order[]>('/api/v1/orders/batch', { orders });
}

// ============================================================================
// ORDER RETRIEVAL
// ============================================================================

/**
 * Get order by ID
 * 
 * @param orderId - Order ID
 * @returns Order details including fills and status
 * @throws ApiError if order not found
 */
export async function getOrder(orderId: string): Promise<Order> {
  return get<Order>(`/api/v1/orders/${orderId}`);
}

/**
 * Get all user orders with optional filters
 * 
 * @param filters - Optional filters for status, date range, exchange
 * @returns Paginated list of orders
 * @throws ApiError if request fails
 * 
 * Example:
 * ```ts
 * const orders = await getOrders({
 *   status: 'open',
 *   startDate: '2026-01-01',
 *   limit: 50
 * });
 * ```
 */
export async function getOrders(filters?: {
  status?: 'pending' | 'open' | 'filled' | 'cancelled' | 'failed';
  startDate?: string;
  endDate?: string;
  exchange?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResponse<Order>> {
  return get<PaginatedResponse<Order>>('/api/v1/orders', {
    params: filters,
  });
}

/**
 * Get currently active (open) orders
 * 
 * @returns Array of open orders
 * @throws ApiError if request fails
 */
export async function getActiveOrders(): Promise<Order[]> {
  return get<Order[]>('/api/v1/orders/active');
}

/**
 * Get order execution history (fills)
 * 
 * @param orderId - Order ID
 * @returns Array of order fills with prices and quantities
 * @throws ApiError if order not found
 */
export async function getOrderFills(orderId: string): Promise<OrderFill[]> {
  return get<OrderFill[]>(`/api/v1/orders/${orderId}/fills`);
}

// ============================================================================
// ORDER MANAGEMENT
// ============================================================================

/**
 * Cancel an open order
 * 
 * @param orderId - Order ID to cancel
 * @returns Updated order with cancelled status
 * @throws ApiError if order cannot be cancelled (already filled, etc.)
 */
export async function cancelOrder(orderId: string): Promise<Order> {
  return put<Order>(`/api/v1/orders/${orderId}/cancel`);
}

/**
 * Cancel all open orders for a specific exchange
 * 
 * @param exchange - Exchange ID
 * @returns Array of cancelled orders
 * @throws ApiError if cancellation fails
 */
export async function cancelAllOrders(exchange?: string): Promise<Order[]> {
  return put<Order[]>('/api/v1/orders/cancel-all', { exchange });
}

// ============================================================================
// ORDER STATUS
// ============================================================================

/**
 * Get real-time order status
 * Use this for polling order execution status
 * 
 * @param orderId - Order ID
 * @returns Current order status with fill percentage
 * @throws ApiError if order not found
 * 
 * Example - Poll for completion:
 * ```ts
 * const pollInterval = setInterval(async () => {
 *   const status = await getOrderStatus(orderId);
 *   if (status.status === 'filled') {
 *     clearInterval(pollInterval);
 *     console.log('Order completed!');
 *   }
 * }, 2000);
 * ```
 */
export async function getOrderStatus(orderId: string): Promise<{
  id: string;
  status: Order['status'];
  filledPercent: number;
  fills: OrderFill[];
  updatedAt: string;
}> {
  return get(`/api/v1/orders/${orderId}/status`);
}

// ============================================================================
// TRADE HISTORY
// ============================================================================

/**
 * Get trade history with filters
 * 
 * @param filters - Filters for pair, exchange, side, date range
 * @returns Paginated trade history
 * @throws ApiError if request fails
 * 
 * Example:
 * ```ts
 * const trades = await getTradeHistory({
 *   pair: 'BTC-PERP-USDC',
 *   exchange: 'hyperliquid',
 *   startDate: '2026-01-01',
 *   limit: 100
 * });
 * ```
 */
export async function getTradeHistory(
  filters?: TradeHistoryFilters
): Promise<PaginatedResponse<Trade>> {
  return get<PaginatedResponse<Trade>>('/api/v1/trades/history', {
    params: filters,
  });
}

/**
 * Get trade statistics for a time period
 * 
 * @param startDate - Start date (ISO string)
 * @param endDate - End date (ISO string)
 * @returns Trade statistics including volume, count, PnL
 * @throws ApiError if request fails
 */
export async function getTradeStats(
  startDate: string,
  endDate: string
): Promise<{
  totalVolume: number;
  tradeCount: number;
  totalPnL: number;
  winRate: number;
  avgTradeSize: number;
}> {
  return get('/api/v1/trades/stats', {
    params: { startDate, endDate },
  });
}

// ============================================================================
// AVAILABLE PAIRS
// ============================================================================

/**
 * Get available trading pairs for an exchange
 * 
 * @param exchange - Exchange ID
 * @returns Array of supported trading pairs
 * @throws ApiError if request fails
 */
export async function getAvailablePairs(exchange: string): Promise<string[]> {
  return get<string[]>(`/api/v1/exchanges/${exchange}/pairs`);
}

/**
 * Get pair details including min/max order sizes and decimals
 * 
 * @param exchange - Exchange ID
 * @param pair - Trading pair symbol
 * @returns Pair configuration details
 * @throws ApiError if pair not found
 */
export async function getPairDetails(exchange: string, pair: string): Promise<{
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  minOrderSize: number;
  maxOrderSize: number;
  priceDecimals: number;
  quantityDecimals: number;
  isActive: boolean;
}> {
  return get(`/api/v1/exchanges/${exchange}/pairs/${pair}`);
}
