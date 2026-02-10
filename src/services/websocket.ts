/**
 * WebSocket Client
 * 
 * Real-time data updates via WebSocket connection.
 * Handles automatic reconnection, message routing, and subscription management.
 * 
 * Usage:
 * ```ts
 * const ws = new WebSocketClient(WS_URL);
 * ws.connect();
 * 
 * ws.subscribe('funding-rates', (data) => {
 *   console.log('Funding rate update:', data);
 * });
 * ```
 */

import { logger } from '../utils/logger';
import type { WebSocketMessage, PriceUpdate, FundingRateUpdate } from '../types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const WS_URL = import.meta.env.VITE_WS_URL || 'wss://ws.bitfrost.com';
const RECONNECT_DELAY = 3000; // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 5;
const PING_INTERVAL = 30000; // 30 seconds

// ============================================================================
// TYPES
// ============================================================================

type MessageHandler = (data: any) => void;
type ConnectionHandler = () => void;
type ErrorHandler = (error: Error) => void;

interface Subscription {
  channel: string;
  handler: MessageHandler;
}

// ============================================================================
// WEBSOCKET CLIENT
// ============================================================================

/**
 * WebSocket Client for real-time data updates
 * 
 * Features:
 * - Automatic reconnection on disconnect
 * - Message routing by channel
 * - Subscription management
 * - Connection state management
 * - Ping/pong heartbeat
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private subscriptions: Map<string, MessageHandler[]> = new Map();
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private isManualClose = false;

  // Event handlers
  private onConnectHandlers: ConnectionHandler[] = [];
  private onDisconnectHandlers: ConnectionHandler[] = [];
  private onErrorHandlers: ErrorHandler[] = [];

  constructor(url: string = WS_URL) {
    this.url = url;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      logger.ws('Already connected or connecting');
      return;
    }

    if (this.isConnecting) {
      logger.ws('Connection already in progress');
      return;
    }

    this.isConnecting = true;

    try {
      logger.ws(`Connecting to ${this.url}...`);
      
      // WebSocket connections use HTTP-only cookies for authentication
      // No need to pass token in URL - cookies are sent automatically
      this.ws = new WebSocket(this.url);
      
      // Setup event listeners
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      
    } catch (error) {
      logger.error('WebSocket connection error', error);
      this.isConnecting = false;
      this.handleError(error as Event);
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    logger.ws('Disconnecting...');
    
    this.isManualClose = true;
    this.clearTimers();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Subscribe to a data channel
   * 
   * @param channel - Channel name (e.g., 'funding-rates', 'prices', 'orders')
   * @param handler - Callback function for messages
   * @returns Unsubscribe function
   * 
   * Example:
   * ```ts
   * const unsubscribe = ws.subscribe('funding-rates', (update) => {
   *   console.log('Funding rate:', update);
   * });
   * 
   * // Later, unsubscribe
   * unsubscribe();
   * ```
   */
  subscribe(channel: string, handler: MessageHandler): () => void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, []);
    }
    
    this.subscriptions.get(channel)!.push(handler);
    
    // Send subscription message to server
    this.send({
      type: 'subscribe',
      channel,
    });
    
    logger.ws(`Subscribed to ${channel}`);
    
    // Return unsubscribe function
    return () => this.unsubscribe(channel, handler);
  }

  /**
   * Unsubscribe from a data channel
   */
  unsubscribe(channel: string, handler: MessageHandler): void {
    const handlers = this.subscriptions.get(channel);
    
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
      
      // If no more handlers for this channel, unsubscribe from server
      if (handlers.length === 0) {
        this.subscriptions.delete(channel);
        this.send({
          type: 'unsubscribe',
          channel,
        });
        logger.ws(`Unsubscribed from ${channel}`);
      }
    }
  }

  /**
   * Send a message to the server
   */
  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      logger.warn('Cannot send message - not connected');
    }
  }

  /**
   * Register connection handler
   */
  onConnect(handler: ConnectionHandler): () => void {
    this.onConnectHandlers.push(handler);
    return () => {
      const index = this.onConnectHandlers.indexOf(handler);
      if (index > -1) this.onConnectHandlers.splice(index, 1);
    };
  }

  /**
   * Register disconnection handler
   */
  onDisconnect(handler: ConnectionHandler): () => void {
    this.onDisconnectHandlers.push(handler);
    return () => {
      const index = this.onDisconnectHandlers.indexOf(handler);
      if (index > -1) this.onDisconnectHandlers.splice(index, 1);
    };
  }

  /**
   * Register error handler
   */
  onError(handler: ErrorHandler): () => void {
    this.onErrorHandlers.push(handler);
    return () => {
      const index = this.onErrorHandlers.indexOf(handler);
      if (index > -1) this.onErrorHandlers.splice(index, 1);
    };
  }

  /**
   * Get connection state
   */
  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    logger.ws('Connected');
    
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    // Start ping/pong heartbeat
    this.startPing();
    
    // Resubscribe to all channels
    this.resubscribeAll();
    
    // Notify connection handlers
    this.onConnectHandlers.forEach(handler => handler());
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      // Handle pong response
      if (message.type === 'pong') {
        return;
      }
      
      // Route message to appropriate subscribers
      const handlers = this.subscriptions.get(message.type);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(message.data);
          } catch (error) {
            logger.error(`Error in message handler:`, error);
          }
        });
      }
      
    } catch (error) {
      logger.error('Error parsing message:', error);
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    logger.error('WebSocket error:', event);
    
    this.onErrorHandlers.forEach(handler => {
      handler(new Error('WebSocket error'));
    });
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(): void {
    logger.ws('Disconnected');
    
    this.isConnecting = false;
    this.clearTimers();
    
    // Notify disconnection handlers
    this.onDisconnectHandlers.forEach(handler => handler());
    
    // Attempt to reconnect if not manually closed
    if (!this.isManualClose) {
      this.reconnect();
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private reconnect(): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      logger.error('Max reconnection attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts - 1);
    
    logger.ws(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Resubscribe to all channels after reconnection
   */
  private resubscribeAll(): void {
    this.subscriptions.forEach((_, channel) => {
      this.send({
        type: 'subscribe',
        channel,
      });
    });
  }

  /**
   * Start ping/pong heartbeat
   */
  private startPing(): void {
    this.pingTimer = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping' });
      }
    }, PING_INTERVAL);
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Global WebSocket client instance
 * Use this for app-wide real-time updates
 */
export const wsClient = new WebSocketClient();