/**
 * Orders Hook
 * 
 * Custom hook for managing orders with real-time status updates.
 * 
 * Usage:
 * ```tsx
 * function OrderPage() {
 *   const { create, activeOrders, loading } = useOrders();
 *   
 *   const handleSubmit = async (orderData) => {
 *     const order = await create(orderData);
 *     console.log('Order created:', order.id);
 *   };
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { createOrder, getActiveOrders, getOrder, cancelOrder } from '../services/api/orders';
import { wsClient } from '../services/websocket';
import type { Order, CreateOrderRequest } from '../types';

// ============================================================================
// TYPES
// ============================================================================

interface UseOrdersReturn {
  /**
   * List of active orders
   */
  activeOrders: Order[];
  
  /**
   * Whether data is loading
   */
  loading: boolean;
  
  /**
   * Error if any
   */
  error: Error | null;
  
  /**
   * Create a new order
   */
  create: (orderData: CreateOrderRequest) => Promise<Order>;
  
  /**
   * Cancel an order
   */
  cancel: (orderId: string) => Promise<void>;
  
  /**
   * Refresh orders list
   */
  refetch: () => Promise<void>;
  
  /**
   * Get a specific order by ID
   */
  getById: (orderId: string) => Order | undefined;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for order management with real-time updates
 * 
 * Features:
 * - Create orders
 * - Track active orders
 * - Real-time order status updates via WebSocket
 * - Cancel orders
 * 
 * @param enableRealtime - Enable WebSocket updates (default: true)
 * @returns Order management functions and state
 * 
 * Example:
 * ```tsx
 * const { create, activeOrders, cancel, loading } = useOrders();
 * 
 * // Create order
 * const handleCreateOrder = async () => {
 *   try {
 *     const order = await create({
 *       type: 'multi',
 *       buyExchange: 'hyperliquid',
 *       buyPair: 'BTC-PERP-USDC',
 *       buyQuantity: 0.5,
 *       sellExchange: 'binance',
 *       sellPair: 'BTCUSDT',
 *       sellQuantity: 0.5
 *     });
 *     console.log('Order created:', order.id);
 *   } catch (error) {
 *     console.error('Failed to create order:', error);
 *   }
 * };
 * 
 * // Display active orders
 * {activeOrders.map(order => (
 *   <div key={order.id}>
 *     {order.buyPair} → {order.sellPair}
 *     <button onClick={() => cancel(order.id)}>Cancel</button>
 *   </div>
 * ))}
 * ```
 */
export function useOrders(enableRealtime: boolean = true): UseOrdersReturn {
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch active orders
   */
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const orders = await getActiveOrders();
      setActiveOrders(orders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new order
   */
  const create = useCallback(async (orderData: CreateOrderRequest): Promise<Order> => {
    try {
      const order = await createOrder(orderData);
      
      // Add to active orders
      setActiveOrders(prev => [order, ...prev]);
      
      return order;
    } catch (err) {
      console.error('Error creating order:', err);
      throw err;
    }
  }, []);

  /**
   * Cancel an order
   */
  const cancel = useCallback(async (orderId: string): Promise<void> => {
    try {
      await cancelOrder(orderId);
      
      // Remove from active orders or update status
      setActiveOrders(prev => prev.filter(order => order.id !== orderId));
    } catch (err) {
      console.error('Error cancelling order:', err);
      throw err;
    }
  }, []);

  /**
   * Get order by ID
   */
  const getById = useCallback((orderId: string): Order | undefined => {
    return activeOrders.find(order => order.id === orderId);
  }, [activeOrders]);

  /**
   * Handle WebSocket order update
   */
  const handleOrderUpdate = useCallback((update: {
    orderId: string;
    status: Order['status'];
    fills?: any[];
  }) => {
    setActiveOrders(prev => {
      const index = prev.findIndex(order => order.id === update.orderId);
      
      if (index === -1) {
        // Order not in list, might be a new order or from another session
        // Refetch to get latest
        fetchOrders();
        return prev;
      }
      
      // Update order status
      const newOrders = [...prev];
      newOrders[index] = {
        ...newOrders[index],
        status: update.status,
        fills: update.fills || newOrders[index].fills,
        updatedAt: new Date().toISOString(),
      };
      
      // Remove from active orders if filled or cancelled
      if (update.status === 'filled' || update.status === 'cancelled') {
        return newOrders.filter(order => order.id !== update.orderId);
      }
      
      return newOrders;
    });
  }, [fetchOrders]);

  /**
   * Initial fetch on mount
   */
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /**
   * Setup WebSocket subscription for real-time updates
   */
  useEffect(() => {
    if (!enableRealtime) return;

    // Connect WebSocket if not already connected
    if (!wsClient.isConnected) {
      wsClient.connect();
    }

    // Subscribe to order updates
    const unsubscribe = wsClient.subscribe('order_update', handleOrderUpdate);

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [enableRealtime, handleOrderUpdate]);

  return {
    activeOrders,
    loading,
    error,
    create,
    cancel,
    refetch: fetchOrders,
    getById,
  };
}

/**
 * Hook to track a specific order by ID with real-time updates
 * 
 * Useful for order detail pages or order status tracking
 */
export function useOrder(orderId: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch order details
   */
  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const orderData = await getOrder(orderId);
      setOrder(orderData);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  /**
   * Handle WebSocket order update
   */
  const handleUpdate = useCallback((update: any) => {
    if (update.orderId === orderId) {
      setOrder(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: update.status,
          fills: update.fills || prev.fills,
          updatedAt: new Date().toISOString(),
        };
      });
    }
  }, [orderId]);

  /**
   * Initial fetch
   */
  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  /**
   * WebSocket subscription
   */
  useEffect(() => {
    if (!wsClient.isConnected) {
      wsClient.connect();
    }

    const unsubscribe = wsClient.subscribe('order_update', handleUpdate);

    return () => {
      unsubscribe();
    };
  }, [handleUpdate]);

  return {
    order,
    loading,
    error,
    refetch: fetchOrder,
  };
}
