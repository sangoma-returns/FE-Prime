import { z } from 'zod';

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const marketMakerFormSchema = z.object({
  exchange: z.string().min(1, 'Exchange is required'),
  pair: z.string().min(1, 'Trading pair is required'),
  margin: z.string().refine((val) => parseFloat(val) > 0, 'Margin must be greater than 0'),
  leverage: z.string().refine((val) => parseFloat(val) > 0, 'Leverage must be greater than 0'),
  spreadBps: z.string().refine((val) => parseFloat(val) >= 0, 'Spread must be non-negative'),
  orderLevels: z.string().refine((val) => parseFloat(val) > 0, 'Order levels must be greater than 0'),
  orderAmount: z.string().refine((val) => parseFloat(val) > 0, 'Order amount must be greater than 0'),
  refreshTime: z.string().refine((val) => parseFloat(val) > 0, 'Refresh time must be greater than 0'),
  inventorySkew: z.string(),
  minSpread: z.string().refine((val) => parseFloat(val) >= 0, 'Min spread must be non-negative'),
  maxSpread: z.string().refine((val) => parseFloat(val) >= 0, 'Max spread must be non-negative'),
  stopLoss: z.string().refine((val) => parseFloat(val) >= 0, 'Stop loss must be non-negative'),
  takeProfit: z.string().refine((val) => parseFloat(val) >= 0, 'Take profit must be non-negative'),
  participationRate: z.enum(['passive', 'neutral', 'aggressive']),
  enableAutoRepeat: z.boolean(),
  maxRuns: z.string().refine((val) => parseFloat(val) > 0, 'Max runs must be greater than 0'),
  enablePnlTolerance: z.boolean(),
  tolerancePercent: z.string().refine((val) => parseFloat(val) >= 0, 'Tolerance must be non-negative'),
});

export const vaultFormSchema = z.object({
  selectedVault: z.string().nullable(),
  deployCapital: z.string().refine((val) => parseFloat(val) > 0, 'Capital must be greater than 0'),
  leverage: z.string().refine((val) => parseFloat(val) > 0, 'Leverage must be greater than 0'),
  slippageTolerance: z.string().refine((val) => parseFloat(val) >= 0, 'Slippage must be non-negative'),
  maxDrawdown: z.string().refine((val) => parseFloat(val) >= 0, 'Max drawdown must be non-negative'),
});

export const strategySchema = z.object({
  id: z.string(),
  name: z.string(),
  exchange: z.string().min(1, 'Exchange is required'),
  pair: z.string().min(1, 'Trading pair is required'),
  margin: z.string().refine((val) => parseFloat(val) > 0, 'Margin must be greater than 0'),
  leverage: z.string().refine((val) => parseFloat(val) > 0, 'Leverage must be greater than 0'),
  spreadBps: z.string(),
  orderLevels: z.string(),
  orderAmount: z.string(),
  refreshTime: z.string(),
  inventorySkew: z.string(),
  minSpread: z.string(),
  maxSpread: z.string(),
  stopLoss: z.string(),
  takeProfit: z.string(),
  participationRate: z.enum(['passive', 'neutral', 'aggressive']),
  enableAutoRepeat: z.boolean(),
  maxRuns: z.string(),
  enablePnlTolerance: z.boolean(),
  tolerancePercent: z.string(),
  expanded: z.boolean(),
  submitted: z.boolean(),
});

export const multiOrderFormSchema = z.object({
  strategies: z.array(strategySchema).min(1, 'At least one strategy is required'),
});

export const enterpriseFormSchema = z.object({
  enterpriseCode: z.string().min(1, 'Enterprise code is required'),
  selectedFeature: z.string().nullable(),
  selectedExchanges: z.array(z.string()),
  selectedPairs: z.array(z.string()),
  apiKey: z.string(),
  executionSpeed: z.enum(['conservative', 'moderate', 'aggressive']),
  maxPositionSize: z.string().refine((val) => parseFloat(val) > 0, 'Max position size must be greater than 0'),
  riskLimit: z.string().refine((val) => parseFloat(val) >= 0, 'Risk limit must be non-negative'),
});

// ============================================================================
// TYPESCRIPT TYPES
// ============================================================================

export type MarketMakerFormData = z.infer<typeof marketMakerFormSchema>;
export type VaultFormData = z.infer<typeof vaultFormSchema>;
export type StrategyFormData = z.infer<typeof strategySchema>;
export type MultiOrderFormData = z.infer<typeof multiOrderFormSchema>;
export type EnterpriseFormData = z.infer<typeof enterpriseFormSchema>;

export interface Vault {
  id: string;
  name: string;
  pnl: number;
  volume: number;
  tvl: number;
  apy: number;
}

export interface ExchangePoints {
  name: string;
  supportsPoints: boolean;
  pointsEarned: number | null;
  status?: 'active' | 'concluded';
}

export interface StrategyEstimates {
  volumePerRun: number;
  actualRunsPerDay: number;
  dailyVolume: number;
  makerFees: number;
  spreadProfit: number;
  dailyReturn: number;
  dailyReturnPercent: number;
  monthlyReturn: number;
  monthlyReturnPercent: number;
}

export interface SimulationResults {
  totalPnL: number;
  totalExposure: number;
  overallRoi: number;
  strategyResults: any[];
  exchangeExposure: { [key: string]: number };
  exchangePnL: { [key: string]: number };
  correlations: { [key: string]: number };
  riskMetrics: {
    maxDrawdown: number;
    sharpeRatio: number;
    diversificationBenefit: number;
  };
}

// Tooltips
export const TOOLTIPS: Record<string, string> = {
  baseSpread: 'The minimum price difference between buy and sell orders',
  orderLevels: 'Number of price levels on each side of the order book',
  orderAmount: 'Size of each individual order in USDC',
  refreshTime: 'How frequently to update orders based on market conditions',
  inventorySkew: 'Adjusts order sizes to rebalance inventory - negative favors selling, positive favors buying',
  minSpread: 'Minimum allowed spread during volatile conditions',
  maxSpread: 'Maximum allowed spread during low volatility',
  stopLoss: 'Maximum loss percentage before strategy stops',
  takeProfit: 'Target profit percentage to lock in gains',
  participationRate: 'How frequently the bot participates in market making - Aggressive (5 min), Neutral (15 min), Passive (30-60 min avg)',
  autoRepeat: 'Automatically restart the bot after it completes a run',
  maxRuns: 'Maximum number of times to run the bot automatically',
  pnlTolerance: 'If enabled, bot will only repeat if ending PNL is within the specified tolerance range',
  tolerancePercent: 'PNL tolerance range (±) - bot repeats only if ending equity change is within this percentage',
};

// Mock data
export const VAULTS: Vault[] = [
  { id: 'velar', name: 'Velar', pnl: 12.4, volume: 245000000, tvl: 8500000, apy: 18.2 },
  { id: 'wintermute', name: 'Wintermute', pnl: 8.7, volume: 520000000, tvl: 12000000, apy: 14.5 },
  { id: 'jump', name: 'Jump Trading', pnl: 15.2, volume: 380000000, tvl: 9200000, apy: 22.1 },
  { id: 'gsr', name: 'GSR', pnl: 6.3, volume: 190000000, tvl: 5500000, apy: 11.8 },
  { id: 'cumberland', name: 'Cumberland', pnl: 4.1, volume: 850000000, tvl: 18000000, apy: 8.5 },
  { id: 'b2c2', name: 'B2C2', pnl: 22.8, volume: 120000000, tvl: 3800000, apy: 28.4 },
];

export const EXCHANGE_POINTS: ExchangePoints[] = [
  { name: 'Hyperliquid', supportsPoints: true, pointsEarned: 12450, status: 'active' },
  { name: 'Paradex', supportsPoints: true, pointsEarned: 8320, status: 'active' },
  { name: 'Aster', supportsPoints: true, pointsEarned: 6890, status: 'active' },
  { name: 'Binance', supportsPoints: true, pointsEarned: 25680, status: 'concluded' },
  { name: 'Bybit', supportsPoints: true, pointsEarned: 15240, status: 'active' },
  { name: 'OKX', supportsPoints: false, pointsEarned: null },
];
