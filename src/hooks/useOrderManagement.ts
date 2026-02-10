/**
 * Order Management Hook
 * 
 * Handles order creation, lifecycle, and navigation.
 * Provides a clean interface for order-related operations.
 * 
 * @example
 * ```tsx
 * const { handleCreateOrder, handleClearOrder } = useOrderManagement(navigateTo);
 * 
 * // Create order and navigate to portfolio
 * handleCreateOrder({
 *   buyExchange: 'hyperliquid',
 *   sellExchange: 'binance',
 *   // ...
 * });
 * ```
 */

import { useCallback } from 'react';
import { useAppStore } from '../stores/appStore';
import type { Order, CreateOrderRequest } from '../types';
import type { Page } from './useNavigation';

// ============================================================================
// TYPES
// ============================================================================

interface UseOrderManagementProps {
  /** Navigation function */
  navigateTo: (page: Page, queryParams?: string) => void;
}

interface UseOrderManagementReturn {
  /** Create a new order and navigate to portfolio */
  handleCreateOrder: (orderRequest: CreateOrderRequest) => void;
  /** Clear the active order */
  handleClearOrder: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing order operations
 * 
 * Handles order creation with proper ID and timestamp generation,
 * updates app state, and manages navigation flow.
 * 
 * @param props - Navigation controls
 * @returns Order management functions
 */
export function useOrderManagement({
  navigateTo,
}: UseOrderManagementProps): UseOrderManagementReturn {
  const createOrder = useAppStore((state) => state.createOrder);
  const clearOrder = useAppStore((state) => state.clearOrder);

  /**
   * Create a new order
   * 
   * - Generates unique order ID
   * - Adds timestamp and metadata
   * - Updates app state
   * - Navigates to portfolio page
   */
  const handleCreateOrder = useCallback(
    (orderRequest: CreateOrderRequest) => {
      const order: Order = {
        id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: 'current-user', // TODO: Get from wallet context
        status: 'pending',
        type: orderRequest.type,
        buyExchange: orderRequest.buyExchange,
        buyPair: orderRequest.buyPair,
        buyQuantity: orderRequest.buyQuantity,
        buyPrice: orderRequest.buyPrice,
        sellExchange: orderRequest.sellExchange,
        sellPair: orderRequest.sellPair,
        sellQuantity: orderRequest.sellQuantity,
        sellPrice: orderRequest.sellPrice,
        duration: orderRequest.duration,
        strategy: orderRequest.strategy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      createOrder(order);
      // Navigate to portfolio with history tab and execution detail view
      navigateTo('portfolio', 'tab=history&filter=Single&detailTab=execution');
    },
    [createOrder, navigateTo]
  );

  /**
   * Clear the active order
   */
  const handleClearOrder = useCallback(() => {
    clearOrder();
  }, [clearOrder]);

  return {
    handleCreateOrder,
    handleClearOrder,
  };
}