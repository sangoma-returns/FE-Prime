/**
 * App Store (Zustand)
 * 
 * Global state management for core application state.
 * Replaces AppContext with better performance and simpler API.
 * 
 * Features:
 * - Onboarding flow state
 * - Account setup and configuration
 * - Exchange selection and allocations
 * - Active orders
 * - Trade pre-selection
 * - Active market maker strategies
 * - Transaction history tracking
 * - Token balance tracking per exchange
 * 
 * @example
 * ```tsx
 * const { hasDeposited, depositAmount, completeDeposit } = useAppStore();
 * 
 * // Update state
 * completeDeposit(1000);
 * 
 * // Selective subscription (better performance)
 * const depositAmount = useAppStore((s) => s.depositAmount);
 * ```
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Order } from '../types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Pre-selected trade data from Explore page
 */
export interface PreselectedTrade {
  buyToken: string;
  buyExchange: string;
  sellToken: string;
  sellExchange: string;
}

/**
 * Active market maker strategy
 */
export interface ActiveMarketMakerStrategy {
  id: string;
  name: string;
  exchange: string;
  pair: string;
  margin: number;
  leverage: number;
  spreadBps: number;
  orderLevels: number;
  orderAmount: number;
  refreshTime: number;
  inventorySkew: number;
  minSpread: number;
  maxSpread: number;
  stopLoss: number;
  takeProfit: number;
  participationRate: 'passive' | 'neutral' | 'aggressive';
  enableAutoRepeat: boolean;
  maxRuns: number;
  enablePnlTolerance: boolean;
  tolerancePercent: number;
  status: 'running' | 'paused' | 'completed' | 'stopped';
  startTime: number;
  currentPnl: number;
  currentRoi: number;
  volume: number;
  exposure: number;
  runsCompleted?: number;
}

/**
 * Trade history entry
 */
export interface TradeHistoryEntry {
  pair: string;
  side: 'Multi' | 'Single';
  targetQty: string;
  filled: number;
  timeStart: string;
  strategy: string;
  status: 'Finished';
}

/**
 * Open order entry
 */
export interface OpenOrderEntry {
  longAccount: string;
  longPair: string;
  shortAccount: string;
  shortPair: string;
  notional: string;
  filled: number;
  status: string;
}

/**
 * Transaction history entry
 */
export interface TransactionEntry {
  id: string;
  timestamp: number;
  status: 'completed' | 'pending' | 'failed';
  action: 'deposit' | 'withdrawal' | 'transfer';
  source: string;
  destination: string;
  amount: number;
  token: string;
  fee: number;
  txHash?: string;
}

/**
 * Token balance on a specific exchange
 */
export interface TokenBalance {
  token: string;
  exchange: string;
  totalBalance: number;
  availableBalance: number;
  lockedBalance: number;
  usdValue: number;
  pnl?: number;
  pnlPercent?: number;
}

/**
 * Application state shape
 */
interface AppState {
  /** Whether user has completed deposit */
  hasDeposited: boolean;
  /** Whether user has completed onboarding */
  hasBitfrostAccount: boolean;
  /** Total deposited amount in USDC (vault balance) */
  depositAmount: number;
  /** User-selected exchanges for trading */
  selectedExchanges: string[];
  /** Currently active order */
  activeOrder: Order | null;
  /** Pre-selected trade from Explore page */
  preselectedTrade: PreselectedTrade | null;
  /** Exchange allocations (exchange name -> balance) */
  exchangeAllocations: Record<string, number>;
  /** Active market maker strategies */
  activeMarketMakerStrategies: ActiveMarketMakerStrategy[];
  /** Trade history entries */
  tradeHistory: TradeHistoryEntry[];
  /** Open orders */
  openOrders: OpenOrderEntry[];
  /** Transaction history (deposits, withdrawals, transfers) */
  transactionHistory: TransactionEntry[];
  /** Token balances per exchange (exchange -> token -> balance info) */
  tokenBalances: Record<string, Record<string, TokenBalance>>;
  /** Total trading volume (24h) */
  totalVolume24h: number;
}

/**
 * Application actions
 */
interface AppActions {
  /** Reset all state (on wallet disconnect) */
  disconnectWallet: () => void;
  /** Complete deposit and set amount */
  completeDeposit: (amount: number) => void;
  /** Setup exchanges after onboarding */
  setupExchanges: (exchanges: string[]) => void;
  /** Create a new order */
  createOrder: (order: Order) => void;
  /** Clear active order */
  clearOrder: () => void;
  /** Set pre-selected trade from Explore page */
  setPreselectedTrade: (trade: PreselectedTrade | null) => void;
  /** Update deposit amount (vault balance) */
  updateDepositAmount: (amount: number) => void;
  /** Transfer funds between vault and exchange */
  transferFunds: (exchange: string, amount: number, direction: 'toExchange' | 'fromExchange') => void;
  /** Deploy market maker strategies */
  deployMarketMakerStrategies: (strategies: ActiveMarketMakerStrategy[]) => void;
  /** Update market maker strategy */
  updateMarketMakerStrategy: (id: string, updates: Partial<ActiveMarketMakerStrategy>) => void;
  /** Stop market maker strategy */
  stopMarketMakerStrategy: (id: string) => void;
  /** Add trade to history */
  addTradeToHistory: (trade: TradeHistoryEntry) => void;
  /** Add open order */
  addOpenOrder: (order: OpenOrderEntry) => void;
  /** Add transaction to history */
  addTransaction: (transaction: Omit<TransactionEntry, 'id' | 'timestamp'>) => void;
  /** Update token balance for an exchange */
  updateTokenBalance: (exchange: string, token: string, balance: TokenBalance) => void;
  /** Get all balances for an exchange */
  getExchangeBalances: (exchange: string) => TokenBalance[];
  /** Get balance for a specific token on an exchange */
  getTokenBalance: (exchange: string, token: string) => TokenBalance | null;
  /** Add to total volume */
  addVolume: (volume: number) => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: AppState = {
  hasDeposited: false,
  hasBitfrostAccount: false,
  depositAmount: 0,
  selectedExchanges: [],
  activeOrder: null,
  preselectedTrade: null,
  exchangeAllocations: {},
  activeMarketMakerStrategies: [],
  tradeHistory: [],
  openOrders: [],
  transactionHistory: [],
  tokenBalances: {},
  totalVolume24h: 0,
};

// ============================================================================
// STORE
// ============================================================================

/**
 * App Store
 * 
 * Manages core application state with actions for state updates.
 * Provides predictable, testable state management.
 */
export const useAppStore = create<AppState & AppActions>()(
  devtools(
    (set, get) => ({
      // Initial state
      ...initialState,

      // Actions
      disconnectWallet: () =>
        set(
          () => ({ ...initialState }),
          false,
          'app/disconnectWallet'
        ),

      completeDeposit: (amount: number) =>
        set(
          (state) => ({
            hasDeposited: true,
            depositAmount: amount,
          }),
          false,
          'app/completeDeposit'
        ),

      setupExchanges: (exchanges: string[]) =>
        set(
          (state) => {
            // Initialize exchange allocations with equal distribution
            // All funds from vault are allocated to exchanges
            const initialAllocations: Record<string, number> = {};
            const perExchangeAmount = state.depositAmount / exchanges.length;
            
            exchanges.forEach(exchange => {
              initialAllocations[exchange] = perExchangeAmount;
            });
            
            return {
              hasBitfrostAccount: true,
              selectedExchanges: exchanges,
              exchangeAllocations: initialAllocations,
              // Vault balance becomes 0 as all funds are allocated to exchanges
              depositAmount: 0,
            };
          },
          false,
          'app/setupExchanges'
        ),

      createOrder: (order: Order) =>
        set(
          () => ({ activeOrder: order }),
          false,
          'app/createOrder'
        ),

      clearOrder: () =>
        set(
          () => ({ activeOrder: null }),
          false,
          'app/clearOrder'
        ),

      setPreselectedTrade: (trade: PreselectedTrade | null) =>
        set(
          () => ({ preselectedTrade: trade }),
          false,
          'app/setPreselectedTrade'
        ),

      updateDepositAmount: (amount: number) =>
        set(
          () => ({ depositAmount: amount }),
          false,
          'app/updateDepositAmount'
        ),

      transferFunds: (exchange: string, amount: number, direction: 'toExchange' | 'fromExchange') =>
        set(
          (state) => {
            const currentBalance = state.exchangeAllocations[exchange] || 0;
            const newBalance = direction === 'toExchange' 
              ? currentBalance + amount 
              : currentBalance - amount;
            
            return {
              exchangeAllocations: {
                ...state.exchangeAllocations,
                [exchange]: newBalance,
              },
            };
          },
          false,
          'app/transferFunds'
        ),

      deployMarketMakerStrategies: (strategies: ActiveMarketMakerStrategy[]) =>
        set(
          (state) => ({
            activeMarketMakerStrategies: [
              ...state.activeMarketMakerStrategies,
              ...strategies,
            ],
          }),
          false,
          'app/deployMarketMakerStrategies'
        ),

      updateMarketMakerStrategy: (id: string, updates: Partial<ActiveMarketMakerStrategy>) =>
        set(
          (state) => ({
            activeMarketMakerStrategies: state.activeMarketMakerStrategies.map(strategy =>
              strategy.id === id ? { ...strategy, ...updates } : strategy
            ),
          }),
          false,
          'app/updateMarketMakerStrategy'
        ),

      stopMarketMakerStrategy: (id: string) =>
        set(
          (state) => ({
            activeMarketMakerStrategies: state.activeMarketMakerStrategies.map(strategy =>
              strategy.id === id ? { ...strategy, status: 'stopped' } : strategy
            ),
          }),
          false,
          'app/stopMarketMakerStrategy'
        ),

      addTradeToHistory: (trade: TradeHistoryEntry) =>
        set(
          (state) => ({
            tradeHistory: [trade, ...state.tradeHistory],
          }),
          false,
          'app/addTradeToHistory'
        ),

      addOpenOrder: (order: OpenOrderEntry) =>
        set(
          (state) => ({
            openOrders: [order, ...state.openOrders],
          }),
          false,
          'app/addOpenOrder'
        ),

      addTransaction: (transaction: Omit<TransactionEntry, 'id' | 'timestamp'>) =>
        set(
          (state) => ({
            transactionHistory: [
              {
                ...transaction,
                id: Math.random().toString(36).substr(2, 9),
                timestamp: Date.now(),
              },
              ...state.transactionHistory,
            ],
          }),
          false,
          'app/addTransaction'
        ),

      updateTokenBalance: (exchange: string, token: string, balance: TokenBalance) =>
        set(
          (state) => ({
            tokenBalances: {
              ...state.tokenBalances,
              [exchange]: {
                ...state.tokenBalances[exchange],
                [token]: balance,
              },
            },
          }),
          false,
          'app/updateTokenBalance'
        ),

      getExchangeBalances: (exchange: string) => {
        const state = get();
        const balances = state.tokenBalances[exchange];
        return balances ? Object.values(balances) : [];
      },

      getTokenBalance: (exchange: string, token: string) => {
        const state = get();
        return state.tokenBalances[exchange]?.[token] || null;
      },

      addVolume: (volume: number) =>
        set(
          (state) => ({
            totalVolume24h: state.totalVolume24h + volume,
          }),
          false,
          'app/addVolume'
        ),
    }),
    { name: 'AppStore' }
  )
);

export default useAppStore;