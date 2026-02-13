import { create } from 'zustand';

export interface Trade {
  id: string;
  timestamp: Date;
  type: 'long' | 'short';
  exchange: string;
  token: string;
  size: number;
  entryPrice: number;
  currentPrice?: number;
  pnl?: number;
  pnlPercent?: number;
  fundingRate?: number;
  status: 'open' | 'closed';
  source: 'aggregator' | 'carry' | 'market-maker';
  leverage?: number;
  volume?: number; // Explicit volume for market maker trades (margin × leverage × 20)
}

export interface Order {
  id: string;
  timestamp: Date;
  type: 'long' | 'short' | 'carry';
  exchange: string;
  token: string;
  size: number;
  price: number;
  status: 'pending' | 'in-progress' | 'filled' | 'cancelled';
  filled: number; // Percentage filled (0-100)
  source: 'aggregator' | 'carry' | 'market-maker';
  // For carry trades, store both sides
  carryTrade?: {
    longExchange: string;
    longToken: string;
    longSize: number;
    shortExchange: string;
    shortToken: string;
    shortSize: number;
  };
}

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  type: 'trade' | 'deposit' | 'withdrawal';
  action: string;
  amount: number;
  token?: string;
  exchange?: string;
  status: 'completed' | 'pending' | 'failed';
  pnl?: number;
  volume?: number; // Trading volume (notional value considering leverage)
  source?: 'market-maker' | 'carry' | 'single'; // Source of the trade
  // Additional trade details for TradeDetailView
  buyQuantity?: number;
  buyLeverage?: number;
  sellQuantity?: number;
  sellLeverage?: number;
  buyExchange?: string;
  sellExchange?: string;
  buyPair?: string; // e.g., "xyz:PERP-USDC"
  sellPair?: string; // e.g., "BTC:PERP-USDT"
  buyPrice?: number; // Entry price for buy leg
  sellPrice?: number; // Entry price for sell leg
  duration?: number;
  exchanges?: string[]; // List of exchanges used for execution
}

interface TradesState {
  positions: Trade[];
  openOrders: Order[];
  history: HistoryEntry[];
  addTrade: (trade: Omit<Trade, 'id' | 'timestamp' | 'status'>, skipHistory?: boolean) => void;
  addOrder: (order: Omit<Order, 'id' | 'timestamp'>) => void;
  updatePosition: (id: string, updates: Partial<Trade>) => void;
  updateOrderProgress: (id: string, filled: number, status?: Order['status']) => void;
  closePosition: (id: string, exitPrice: number) => void;
  cancelOrder: (id: string) => void;
  fillOrder: (id: string) => void;
  addHistoryEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  getTotalPnL: () => number;
  getPositionsByExchange: (exchange: string) => Trade[];
  clearAllTrades: () => void;
}

const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useTradesStore = create<TradesState>((set, get) => ({
  positions: [],
  openOrders: [],
  history: [],

  addTrade: (trade, skipHistory = false) => {
    const newTrade: Trade = {
      ...trade,
      id: generateId(),
      timestamp: new Date(),
      status: 'open',
      currentPrice: trade.entryPrice,
      pnl: 0,
      pnlPercent: 0,
    };

    set((state) => ({
      positions: [newTrade, ...state.positions],
    }));

    // Add to history (unless skipHistory is true)
    if (!skipHistory) {
      const leverage = trade.leverage || 1;
      // Use explicit volume if provided (for market maker trades), otherwise calculate
      const volume = trade.volume !== undefined 
        ? trade.volume 
        : (trade.size * trade.entryPrice * leverage);
      
      get().addHistoryEntry({
        type: 'trade',
        action: `${trade.type === 'long' ? 'Long' : 'Short'} ${trade.token} on ${trade.exchange}`,
        amount: trade.size,
        token: trade.token,
        exchange: trade.exchange,
        status: 'completed',
        volume: volume,
        source: trade.source === 'market-maker' ? 'market-maker' : trade.source === 'carry' ? 'carry' : 'single',
      });
    }
  },

  addOrder: (order) => {
    const newOrder: Order = {
      ...order,
      id: generateId(),
      timestamp: new Date(),
      filled: 0,
    };

    set((state) => ({
      openOrders: [newOrder, ...state.openOrders],
    }));
  },

  updatePosition: (id, updates) => {
    set((state) => ({
      positions: state.positions.map((pos) => {
        if (pos.id === id) {
          const updatedPos = { ...pos, ...updates };
          
          // Calculate PnL if currentPrice is updated
          if (updates.currentPrice !== undefined) {
            const priceDiff = updatedPos.currentPrice! - updatedPos.entryPrice;
            const multiplier = updatedPos.type === 'long' ? 1 : -1;
            const pnl = priceDiff * multiplier * updatedPos.size;
            const pnlPercent = (priceDiff / updatedPos.entryPrice) * multiplier * 100;
            
            updatedPos.pnl = pnl;
            updatedPos.pnlPercent = pnlPercent;
          }
          
          return updatedPos;
        }
        return pos;
      }),
    }));
  },

  updateOrderProgress: (id, filled, status) => {
    set((state) => ({
      openOrders: state.openOrders.map((order) =>
        order.id === id ? { ...order, filled, status } : order
      ),
    }));
  },

  closePosition: (id, exitPrice) => {
    const position = get().positions.find((p) => p.id === id);
    if (!position) return;

    const priceDiff = exitPrice - position.entryPrice;
    const multiplier = position.type === 'long' ? 1 : -1;
    const pnl = priceDiff * multiplier * position.size;
    
    const leverage = position.leverage || 1;
    const notional = position.size * exitPrice;
    const volume = notional * leverage; // Volume accounts for leverage

    set((state) => ({
      positions: state.positions.map((pos) =>
        pos.id === id ? { ...pos, status: 'closed' as const, currentPrice: exitPrice } : pos
      ),
    }));

    // Add to history
    get().addHistoryEntry({
      type: 'trade',
      action: `Close ${position.type === 'long' ? 'Long' : 'Short'} ${position.token} on ${position.exchange}`,
      amount: position.size,
      token: position.token,
      exchange: position.exchange,
      status: 'completed',
      pnl: pnl,
      volume: volume,
    });
  },

  cancelOrder: (id) => {
    set((state) => ({
      openOrders: state.openOrders.map((order) =>
        order.id === id ? { ...order, status: 'cancelled' as const } : order
      ),
    }));
  },

  fillOrder: (id) => {
    const order = get().openOrders.find((o) => o.id === id);
    if (!order) return;

    set((state) => ({
      openOrders: state.openOrders.map((o) =>
        o.id === id ? { ...o, status: 'filled' as const, filled: 100 } : o
      ),
    }));

    // Convert order to position(s)
    if (order.type === 'carry' && order.carryTrade) {
      // For carry trades, create two positions (long and short)
      get().addTrade({
        type: 'long',
        exchange: order.carryTrade.longExchange,
        token: order.carryTrade.longToken,
        size: order.carryTrade.longSize,
        entryPrice: order.price,
        source: order.source,
      }, true); // Skip history since we already have a combined entry
      
      get().addTrade({
        type: 'short',
        exchange: order.carryTrade.shortExchange,
        token: order.carryTrade.shortToken,
        size: order.carryTrade.shortSize,
        entryPrice: order.price,
        source: order.source,
      }, true); // Skip history since we already have a combined entry
    } else {
      // For single orders, create one position
      get().addTrade({
        type: order.type as 'long' | 'short',
        exchange: order.exchange,
        token: order.token,
        size: order.size,
        entryPrice: order.price,
        source: order.source,
      });
    }
  },

  addHistoryEntry: (entry) => {
    const newEntry: HistoryEntry = {
      ...entry,
      id: generateId(),
      timestamp: new Date(),
    };

    set((state) => ({
      history: [newEntry, ...state.history],
    }));
  },

  getTotalPnL: () => {
    return get().positions
      .filter((p) => p.status === 'open')
      .reduce((total, pos) => total + (pos.pnl || 0), 0);
  },

  getPositionsByExchange: (exchange) => {
    return get().positions.filter((p) => p.exchange === exchange && p.status === 'open');
  },
  
  clearAllTrades: () => {
    set(() => ({
      positions: [],
      openOrders: [],
      history: [],
    }));
  },
}));
