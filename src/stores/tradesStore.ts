import { create } from 'zustand';
import { shallow } from 'zustand/shallow';

export interface Trade {
  id: string;
  timestamp: number;
  exchange: string;
  symbol: string; // e.g., "BTC:PERP-USD" or "GOLD:PERP-USDC"
  side: 'buy' | 'sell';
  size: number; // Position size in base currency
  executionPrice: number;
  tradingMode: 'aggregator' | 'market-maker' | 'carry' | 'manual';
  orderType: 'market' | 'limit';
  fees?: number; // Trading fees in USDC
  notes?: string;
}

export interface Position {
  symbol: string;
  exchange: string;
  side: 'long' | 'short';
  size: number;
  averageEntryPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  trades: string[]; // Trade IDs that contributed to this position
}

interface PnlSnapshot {
  timestamp: number;
  realizedPnl: number;
  unrealizedPnl: number;
  totalPnl: number;
  byStrategy: {
    aggregator: number;
    'market-maker': number;
    carry: number;
    manual: number;
  };
}

interface TradesStore {
  // Trade history
  trades: Trade[];
  
  // Open positions (currently active)
  positions: Map<string, Position>; // key: "exchange:symbol"
  
  // PNL snapshots for charting
  pnlHistory: PnlSnapshot[];
  
  // Cached PNL values (updated when positions change)
  cachedRealizedPnl: number;
  cachedUnrealizedPnl: number;
  cachedTotalPnl: number;
  cachedPnlByStrategy: { aggregator: number; 'market-maker': number; carry: number; manual: number };
  
  // Open orders (for compatibility with existing code)
  openOrders: any[];
  
  // History (for backward compatibility with old code)
  history: any[];
  
  // Actions
  addTrade: (trade: Omit<Trade, 'id' | 'timestamp'>) => void;
  addOrder: (order: any) => void; // For compatibility
  addHistoryEntry: (entry: any) => void; // For compatibility
  updatePositions: (currentPrices: Map<string, number>) => void;
  updatePositionFromTrade: (trade: Trade) => void;
  updateCachedPnl: () => void; // New method to update cached PNL
  getPosition: (exchange: string, symbol: string) => Position | undefined;
  getRealizedPnl: () => number;
  getUnrealizedPnl: () => number;
  getTotalPnl: () => number;
  getPnlByStrategy: () => { aggregator: number; 'market-maker': number; carry: number; manual: number };
  clearAllTrades: () => void;
  
  // Snapshot PNL for historical charting
  snapshotPnl: () => void;
}

export const useTradesStore = create<TradesStore>((set, get) => ({
  trades: [],
  positions: new Map(),
  pnlHistory: [],
  openOrders: [],
  history: [],
  cachedRealizedPnl: 0,
  cachedUnrealizedPnl: 0,
  cachedTotalPnl: 0,
  cachedPnlByStrategy: { aggregator: 0, 'market-maker': 0, carry: 0, manual: 0 },
  
  addTrade: (tradeData) => {
    const trade: Trade = {
      ...tradeData,
      id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    
    set((state) => ({
      trades: [...state.trades, trade],
    }));
    
    // Update positions based on this trade
    get().updatePositionFromTrade(trade);
    
    // Snapshot PNL after trade
    get().snapshotPnl();
    
    console.log(`✅ Trade recorded: ${trade.side.toUpperCase()} ${trade.size} ${trade.symbol} @ ${trade.executionPrice} on ${trade.exchange}`);
  },
  
  addOrder: (order: any) => {
    set((state) => ({
      openOrders: [...state.openOrders, order],
    }));
  },
  
  addHistoryEntry: (entry: any) => {
    set((state) => ({
      trades: [...state.trades, entry],
      history: [...state.history, entry],
    }));
  },
  
  updatePositionFromTrade: (trade: Trade) => {
    const positionKey = `${trade.exchange}:${trade.symbol}`;
    const currentPositions = new Map(get().positions);
    const existingPosition = currentPositions.get(positionKey);
    
    if (!existingPosition) {
      // New position
      currentPositions.set(positionKey, {
        symbol: trade.symbol,
        exchange: trade.exchange,
        side: trade.side === 'buy' ? 'long' : 'short',
        size: trade.size,
        averageEntryPrice: trade.executionPrice,
        unrealizedPnl: 0,
        realizedPnl: 0,
        trades: [trade.id],
      });
    } else {
      // Existing position - need to update
      const isSameDirection = 
        (existingPosition.side === 'long' && trade.side === 'buy') ||
        (existingPosition.side === 'short' && trade.side === 'sell');
      
      if (isSameDirection) {
        // Adding to position - calculate new average entry price
        const totalCost = existingPosition.size * existingPosition.averageEntryPrice + trade.size * trade.executionPrice;
        const newSize = existingPosition.size + trade.size;
        
        currentPositions.set(positionKey, {
          ...existingPosition,
          size: newSize,
          averageEntryPrice: totalCost / newSize,
          trades: [...existingPosition.trades, trade.id],
        });
      } else {
        // Closing or reversing position
        if (trade.size >= existingPosition.size) {
          // Fully closing or reversing
          const closedSize = existingPosition.size;
          const pnlPerUnit = existingPosition.side === 'long' 
            ? (trade.executionPrice - existingPosition.averageEntryPrice)
            : (existingPosition.averageEntryPrice - trade.executionPrice);
          const realizedPnl = pnlPerUnit * closedSize;
          
          if (trade.size === existingPosition.size) {
            // Fully closed - remove position
            currentPositions.delete(positionKey);
            
            // Track realized PNL in a separate way (you might want a separate realizedPnlTotal variable)
            console.log(`✅ Position closed: ${realizedPnl.toFixed(2)} USDC PNL`);
          } else {
            // Reversed position
            const remainingSize = trade.size - existingPosition.size;
            currentPositions.set(positionKey, {
              symbol: trade.symbol,
              exchange: trade.exchange,
              side: trade.side === 'buy' ? 'long' : 'short',
              size: remainingSize,
              averageEntryPrice: trade.executionPrice,
              unrealizedPnl: 0,
              realizedPnl: existingPosition.realizedPnl + realizedPnl,
              trades: [trade.id],
            });
          }
        } else {
          // Partially closing position
          const pnlPerUnit = existingPosition.side === 'long'
            ? (trade.executionPrice - existingPosition.averageEntryPrice)
            : (existingPosition.averageEntryPrice - trade.executionPrice);
          const realizedPnl = pnlPerUnit * trade.size;
          
          currentPositions.set(positionKey, {
            ...existingPosition,
            size: existingPosition.size - trade.size,
            realizedPnl: existingPosition.realizedPnl + realizedPnl,
            trades: [...existingPosition.trades, trade.id],
          });
          
          console.log(`✅ Position partially closed: ${realizedPnl.toFixed(2)} USDC PNL`);
        }
      }
    }
    
    set({ positions: currentPositions });
    
    // Update cached PNL values
    get().updateCachedPnl();
  },
  
  updatePositions: (currentPrices: Map<string, number>) => {
    const positions = new Map(get().positions);
    let updated = false;
    
    for (const [key, position] of positions.entries()) {
      const currentPrice = currentPrices.get(position.symbol);
      
      if (currentPrice !== undefined) {
        const pnlPerUnit = position.side === 'long'
          ? (currentPrice - position.averageEntryPrice)
          : (position.averageEntryPrice - currentPrice);
        
        const unrealizedPnl = pnlPerUnit * position.size;
        
        if (position.unrealizedPnl !== unrealizedPnl) {
          position.unrealizedPnl = unrealizedPnl;
          updated = true;
        }
      }
    }
    
    if (updated) {
      set({ positions });
      // Update cached PNL values
      get().updateCachedPnl();
    }
  },
  
  updateCachedPnl: () => {
    const realizedPnl = get().getRealizedPnl();
    const unrealizedPnl = get().getUnrealizedPnl();
    const totalPnl = realizedPnl + unrealizedPnl;
    const byStrategy = get().getPnlByStrategy();
    
    set({
      cachedRealizedPnl: realizedPnl,
      cachedUnrealizedPnl: unrealizedPnl,
      cachedTotalPnl: totalPnl,
      cachedPnlByStrategy: byStrategy,
    });
  },
  
  getPosition: (exchange: string, symbol: string) => {
    return get().positions.get(`${exchange}:${symbol}`);
  },
  
  getRealizedPnl: () => {
    const { trades, positions } = get();
    let realizedPnl = 0;
    
    // Sum up realized PNL from current positions
    for (const position of positions.values()) {
      realizedPnl += position.realizedPnl;
    }
    
    // For fully closed positions, we need to calculate from trade history
    // This is a simplified calculation - in production you'd want more sophisticated tracking
    const positionKeys = new Set(Array.from(positions.keys()));
    const closedPositionTrades = trades.filter(t => {
      const key = `${t.exchange}:${t.symbol}`;
      return !positionKeys.has(key);
    });
    
    // Group closed trades by position and calculate PNL
    const closedPositions = new Map<string, Trade[]>();
    for (const trade of closedPositionTrades) {
      const key = `${trade.exchange}:${trade.symbol}`;
      if (!closedPositions.has(key)) {
        closedPositions.set(key, []);
      }
      closedPositions.get(key)!.push(trade);
    }
    
    for (const [key, posTrades] of closedPositions.entries()) {
      let netPosition = 0;
      let totalCost = 0;
      
      for (const trade of posTrades) {
        const sizeChange = trade.side === 'buy' ? trade.size : -trade.size;
        
        if (Math.sign(netPosition) !== Math.sign(netPosition + sizeChange) && netPosition !== 0) {
          // Position reversal - calculate realized PNL
          const avgPrice = totalCost / Math.abs(netPosition);
          const closedSize = Math.min(Math.abs(netPosition), trade.size);
          const pnl = netPosition > 0
            ? (trade.executionPrice - avgPrice) * closedSize
            : (avgPrice - trade.executionPrice) * closedSize;
          realizedPnl += pnl;
        }
        
        netPosition += sizeChange;
        totalCost += trade.executionPrice * trade.size * (trade.side === 'buy' ? 1 : -1);
      }
    }
    
    return realizedPnl;
  },
  
  getUnrealizedPnl: () => {
    const positions = get().positions;
    let unrealizedPnl = 0;
    
    for (const position of positions.values()) {
      unrealizedPnl += position.unrealizedPnl;
    }
    
    return unrealizedPnl;
  },
  
  getTotalPnl: () => {
    return get().getRealizedPnl() + get().getUnrealizedPnl();
  },
  
  getPnlByStrategy: () => {
    const { trades, positions } = get();
    const pnlByStrategy = {
      aggregator: 0,
      'market-maker': 0,
      carry: 0,
      manual: 0,
    };
    
    // Calculate from trade history - this is simplified
    // In production, you'd want to track this more precisely
    for (const trade of trades) {
      const position = get().getPosition(trade.exchange, trade.symbol);
      
      if (position) {
        // Position still open - allocate unrealized PNL proportionally
        const tradeProportion = trade.size / position.size;
        pnlByStrategy[trade.tradingMode] += position.unrealizedPnl * tradeProportion;
      }
    }
    
    return pnlByStrategy;
  },
  
  snapshotPnl: () => {
    const realizedPnl = get().getRealizedPnl();
    const unrealizedPnl = get().getUnrealizedPnl();
    const totalPnl = realizedPnl + unrealizedPnl;
    const byStrategy = get().getPnlByStrategy();
    
    const snapshot: PnlSnapshot = {
      timestamp: Date.now(),
      realizedPnl,
      unrealizedPnl,
      totalPnl,
      byStrategy,
    };
    
    set((state) => ({
      pnlHistory: [...state.pnlHistory, snapshot],
    }));
  },
  
  clearAllTrades: () => {
    set({
      trades: [],
      positions: new Map(),
      pnlHistory: [],
      openOrders: [],
      history: [],
      cachedRealizedPnl: 0,
      cachedUnrealizedPnl: 0,
      cachedTotalPnl: 0,
      cachedPnlByStrategy: { aggregator: 0, 'market-maker': 0, carry: 0, manual: 0 },
    });
    console.log('🗑️ All trades and positions cleared');
  },
}));

// Export type-safe hook
export const useTradesActions = () => {
  const addTrade = useTradesStore((state) => state.addTrade);
  const addOrder = useTradesStore((state) => state.addOrder);
  const addHistoryEntry = useTradesStore((state) => state.addHistoryEntry);
  const updatePositions = useTradesStore((state) => state.updatePositions);
  const clearAllTrades = useTradesStore((state) => state.clearAllTrades);
  const snapshotPnl = useTradesStore((state) => state.snapshotPnl);
  
  return { addTrade, addOrder, addHistoryEntry, updatePositions, clearAllTrades, snapshotPnl };
};

// Export selectors (with proper caching)
export const useTrades = () => useTradesStore((state) => state.trades);
export const usePositions = () => useTradesStore((state) => state.positions);
export const usePositionsArray = () => useTradesStore((state) => Array.from(state.positions.values()));

// Separate hooks for each PNL metric to avoid creating new objects
export const useRealizedPnl = () => useTradesStore((state) => state.cachedRealizedPnl);
export const useUnrealizedPnl = () => useTradesStore((state) => state.cachedUnrealizedPnl);
export const useTotalPnl = () => useTradesStore((state) => state.cachedTotalPnl);
export const usePnlByStrategy = () => useTradesStore((state) => state.cachedPnlByStrategy);

// Combined hook that returns cached PNL data (with shallow comparison)
export const usePnlData = () => {
  return useTradesStore((state) => ({
    realizedPnl: state.cachedRealizedPnl,
    unrealizedPnl: state.cachedUnrealizedPnl,
    totalPnl: state.cachedTotalPnl,
    byStrategy: state.cachedPnlByStrategy,
  }), shallow);
};

export const usePnlHistory = () => useTradesStore((state) => state.pnlHistory);