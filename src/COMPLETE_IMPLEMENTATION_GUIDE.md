# Bitfrost Funding Rate Arbitrage Platform
## Complete Implementation Guide - Production Ready Blueprint

> **Version**: 3.0.0  
> **Last Updated**: February 6, 2026  
> **Author**: Bitfrost Engineering Team  
> **Purpose**: Definitive step-by-step guide to build, deploy, and operate Bitfrost from scratch  
> **Audience**: Any developer should be able to implement this exactly as written

---

## Table of Contents

### Part 1: Foundation (Lines 1-1000)
1. [Executive Summary & Product Vision](#1-executive-summary--product-vision)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack Specifications](#3-technology-stack-specifications)
4. [Development Environment Setup](#4-development-environment-setup)

### Part 2: User Experience (Lines 1001-2500)
5. [Complete User Journey](#5-complete-user-journey)
6. [User Interface Specifications](#6-user-interface-specifications)
7. [Design System](#7-design-system)
8. [Interaction Patterns](#8-interaction-patterns)

### Part 3: Data Layer (Lines 2501-4000)
9. [Data Model & TypeScript Types](#9-data-model--typescript-types)
10. [Database Schema](#10-database-schema)
11. [State Management](#11-state-management)
12. [Data Flow Patterns](#12-data-flow-patterns)

### Part 4: Backend Infrastructure (Lines 4001-6000)
13. [API Architecture](#13-api-architecture)
14. [Authentication & Authorization](#14-authentication--authorization)
15. [Exchange Integration](#15-exchange-integration)
16. [Real-time Data System](#16-real-time-data-system)

### Part 5: Business Logic (Lines 6001-8000)
17. [Funding Rate Algorithm](#17-funding-rate-algorithm)
18. [Arbitrage Calculation Engine](#18-arbitrage-calculation-engine)
19. [Position Management](#19-position-management)
20. [Risk Management System](#20-risk-management-system)

### Part 6: Operations (Lines 8001-10000+)
21. [Deployment & DevOps](#21-deployment--devops)
22. [Monitoring & Observability](#22-monitoring--observability)
23. [Error Handling & Recovery](#23-error-handling--recovery)
24. [Performance Optimization](#24-performance-optimization)
25. [Security Implementation](#25-security-implementation)
26. [Testing Strategy](#26-testing-strategy)
27. [Maintenance & Support](#27-maintenance--support)

---

# Part 1: Foundation

## 1. Executive Summary & Product Vision

### 1.1 What is Bitfrost?

**Bitfrost** is a professional-grade funding rate arbitrage platform that enables traders to capture risk-free returns by exploiting funding rate differentials across cryptocurrency exchanges.

#### The Opportunity

In perpetual futures markets, exchanges charge/pay a "funding rate" every 8 hours to balance long/short interest. These rates vary significantly across exchanges:

**Example Scenario (Real data from Jan 2026)**:
- BTC-PERP on Hyperliquid: **+0.05%** (8hr) = **+54.75% APY**
- BTC-PERP on Paradex: **-0.03%** (8hr) = **-32.85% APY**
- **Spread**: 0.08% per 8hr = **87.6% APY**

**The Arbitrage**:
1. Go **LONG** on Paradex (collect funding)
2. Go **SHORT** on Hyperliquid (collect funding)
3. Net position: **Delta neutral** (no price risk)
4. Net funding: **+0.08%** every 8 hours = **87.6% APY**

#### The Problem Bitfrost Solves

**Manual execution is complex**:
- Monitor 12 exchanges simultaneously
- Calculate optimal spreads in real-time
- Execute orders on multiple venues simultaneously
- Track positions and PnL across all exchanges
- Manage collateral and margin requirements
- Rebalance positions as funding rates change

**Bitfrost automates this**:
- ✅ Single interface to view all funding rates
- ✅ One-click execution of delta-neutral positions
- ✅ Real-time PnL tracking across all venues
- ✅ Automated position management
- ✅ Risk controls and monitoring

### 1.2 Core Features

#### Feature 1: Explore Page (Funding Rate Discovery)
**Purpose**: Find arbitrage opportunities across 12 exchanges

**Functionality**:
- Real-time funding rate table
- 12 exchanges × 50+ tokens = 600+ data points
- Color-coded rates (green = positive, red = negative)
- Interactive cell selection (click 2 cells to create trade)
- Historical rate charts
- Spread calculator
- Sorting and filtering

**User Flow**:
1. User opens Explore page
2. Sees table with current funding rates
3. Identifies spread (e.g., BTC on Hyperliquid vs Paradex)
4. Clicks first cell (Hyperliquid BTC: +0.05%)
5. Clicks second cell (Paradex BTC: -0.03%)
6. System calculates spread: 0.08% (87.6% APY)
7. System navigates to Trade page with pre-filled order

#### Feature 2: Trade Page (Order Execution)
**Purpose**: Execute delta-neutral arbitrage positions

**Functionality**:
- Dual-panel order form (Buy + Sell)
- Pre-filled from Explore page selection
- Exchange/pair selection dropdowns
- Order type selection (Market, Limit, TWAP)
- Quantity and price inputs
- Real-time estimated PnL
- Balance validation
- Order confirmation dialog

**User Flow**:
1. User arrives from Explore page (or manually enters)
2. Buy panel pre-filled: Paradex, BTC, Market
3. Sell panel pre-filled: Hyperliquid, BTC, Market
4. User enters quantity: 1.0 BTC
5. System validates: Check balances on both exchanges
6. System calculates: Estimated funding = $87.60/day
7. User clicks "Submit Multi Order"
8. Confirmation dialog shows details
9. User confirms
10. System executes both legs simultaneously
11. Success toast: "Orders executed successfully"
12. Navigate to Portfolio page

#### Feature 3: Portfolio Page (Position Monitoring)
**Purpose**: Track all positions and performance

**Functionality**:
- Portfolio summary (Total Equity, PnL, Realized/Unrealized)
- Exchange balances with allocation percentages
- Active positions table
- Trade history
- Quick actions (Deposit, Withdraw, Transfer)
- Real-time updates via WebSocket

**Key Metrics**:
- **Total Equity**: Sum of all exchange balances
- **Total PnL**: Realized + Unrealized PnL
- **Directional Bias**: Net long/short exposure
- **Funding Collected**: Total funding payments received
- **ROI**: Return on invested capital

#### Feature 4: Market Maker Page (Automated Strategies)
**Purpose**: Run automated market-making strategies

**Functionality**:
- Strategy creation form
- Grid trading setup
- Risk parameters (max position, stop loss)
- Active strategies grid
- Performance metrics per strategy
- Detailed strategy monitoring

### 1.3 Target Users

#### Primary: Crypto Traders
- **Profile**: Active traders with $10K-$1M capital
- **Goal**: Generate consistent returns with low risk
- **Pain Point**: Manual arbitrage is time-consuming and error-prone
- **Bitfrost Value**: Automated execution and monitoring

#### Secondary: Institutions
- **Profile**: Hedge funds, trading firms, family offices
- **Goal**: Deploy large capital with minimal price impact
- **Pain Point**: Need professional tooling for multi-exchange trading
- **Bitfrost Value**: Enterprise-grade execution and risk management

### 1.4 Success Metrics

#### Business Metrics
- **Monthly Active Users**: 1,000+ (6 months post-launch)
- **Total Value Locked**: $50M+ (12 months)
- **Average Order Size**: $5,000+
- **User Retention**: 60%+ (30-day)

#### Technical Metrics
- **Order Execution Time**: <2 seconds (p99)
- **API Response Time**: <200ms (p50)
- **Uptime**: 99.9%+
- **WebSocket Latency**: <100ms

#### User Satisfaction Metrics
- **NPS Score**: 50+
- **Feature Adoption**: 80%+ use all core features
- **Support Tickets**: <5% of active users
- **Trade Success Rate**: 99%+

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   React UI   │  │  Zustand     │  │  WebSocket   │             │
│  │   Components │  │  State       │  │  Client      │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ HTTPS / WSS
┌───────────────────────────┴─────────────────────────────────────────┐
│                    SUPABASE BACKEND                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Auth        │  │  PostgreSQL  │  │  Edge        │             │
│  │  (SIWE)      │  │  Database    │  │  Functions   │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│  ┌──────────────┐  ┌──────────────┐                               │
│  │  Realtime    │  │  Storage     │                               │
│  │  (WS)        │  │  (Encrypted) │                               │
│  └──────────────┘  └──────────────┘                               │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ API Calls
┌───────────────────────────┴─────────────────────────────────────────┐
│                    EXTERNAL SERVICES                                 │
│  ┌──────────────────────────────────────────────────────┐          │
│  │  CRYPTO EXCHANGES (CEX)                              │          │
│  │  - Hyperliquid API  - Binance API   - Bybit API     │          │
│  │  - Paradex API      - OKX API       - Aster API     │          │
│  └──────────────────────────────────────────────────────┘          │
│  ┌──────────────────────────────────────────────────────┐          │
│  │  RWA DEXS (Hyperliquid HIP-3)                       │          │
│  │  - XYZ DEX    - VNTL DEX    - KM DEX                │          │
│  │  - CASH DEX   - FLX DEX     - HYNA DEX              │          │
│  └──────────────────────────────────────────────────────┘          │
│  ┌──────────────────────────────────────────────────────┐          │
│  │  DATA PROVIDERS                                      │          │
│  │  - Loris API (Funding rates)                        │          │
│  │  - Binance API (Price data, OI, Volume)            │          │
│  │  - Hyperliquid API (HIP-3 market data)             │          │
│  └──────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Frontend Architecture

```
┌────────────────────────────────────────────────────────────┐
│                     App.tsx (Root)                         │
│  - RainbowKit Provider (Wallet connection)                │
│  - Wagmi Provider (Web3 state)                            │
│  - QueryClient Provider (React Query)                     │
│  - Theme Provider (Light/Dark mode)                       │
└────────────────────────┬───────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
┌────────▼─────────┐          ┌─────────▼────────┐
│   Navigation     │          │   AppModals      │
│   - Menu items   │          │   - Deposit      │
│   - Wallet btn   │          │   - Withdraw     │
│   - Theme toggle │          │   - Transfer     │
└────────┬─────────┘          │   - Exchange     │
         │                    │     Selection    │
         │                    └──────────────────┘
         │
┌────────▼─────────────────────────────────────────┐
│              AppRouter (Client-side routing)      │
│  Routes:                                          │
│  - /explore      → ExplorePage                   │
│  - /trade        → FundingRateArbPage           │
│  - /portfolio    → PortfolioPage                │
│  - /market-maker → MarketMakerPage              │
└───────────────────────────────────────────────────┘
```

#### Frontend Component Tree

```
App.tsx
├── Navigation.tsx
│   ├── Logo
│   ├── NavItems []
│   │   ├── Explore
│   │   ├── Trade
│   │   ├── Market Maker
│   │   └── Portfolio
│   ├── CustomConnectButton (Wallet)
│   ├── ThemeToggle
│   └── NotificationsDropdown
│
├── AppRouter.tsx
│   ├── ExplorePage.tsx
│   │   ├── TimeframeSelector
│   │   ├── SearchInput
│   │   ├── FundingRateTable
│   │   │   ├── TableHeader
│   │   │   └── TableBody
│   │   │       └── FundingRateRow []
│   │   │           ├── TokenCell
│   │   │           └── ExchangeCell []
│   │   │               └── FundingRateCell (clickable)
│   │   └── HistoricalChart (conditional)
│   │
│   ├── FundingRateArbPage.tsx (Trade)
│   │   ├── OrderPanel (Buy)
│   │   │   ├── ExchangePairSelector
│   │   │   │   ├── ExchangeDropdown
│   │   │   │   └── PairDropdown
│   │   │   ├── OrderTypeSelector
│   │   │   ├── QuantityInput
│   │   │   ├── PriceInput (if Limit)
│   │   │   └── BalanceDisplay
│   │   ├── OrderPanel (Sell)
│   │   │   └── (same as Buy panel)
│   │   ├── EstimatedProfitCard
│   │   └── SubmitButton
│   │       └── MultiOrderConfirmation (dialog)
│   │
│   ├── PortfolioPage.tsx
│   │   ├── PortfolioOverview
│   │   │   ├── TotalEquityCard
│   │   │   ├── PnLCard
│   │   │   └── DirectionalBiasCard
│   │   ├── QuickActions
│   │   │   ├── DepositButton
│   │   │   ├── WithdrawButton
│   │   │   └── TransferButton
│   │   ├── PortfolioExchanges
│   │   │   └── ExchangeCard []
│   │   │       ├── ExchangeLogo
│   │   │       ├── Balance
│   │   │       ├── AllocationChart
│   │   │       └── ActionsMenu
│   │   ├── ActivePositionsTable
│   │   │   └── PositionRow []
│   │   │       ├── Symbol
│   │   │       ├── Side
│   │   │       ├── Size
│   │   │       ├── Entry Price
│   │   │       ├── Current Price
│   │   │       ├── PnL
│   │   │       └── CloseButton
│   │   └── TradeHistory
│   │       └── TradeRow []
│   │
│   └── MarketMakerPage.tsx
│       ├── StrategyForm
│       │   ├── ExchangeSelect
│       │   ├── PairSelect
│       │   ├── StrategyTypeSelect
│       │   ├── RiskParameters
│       │   └── StartButton
│       ├── ActiveStrategies []
│       │   └── StrategyCard
│       │       ├── StrategyName
│       │       ├── Performance Metrics
│       │       ├── StatusIndicator
│       │       └── ActionsMenu
│       │           ├── View Details
│       │           ├── Pause/Resume
│       │           └── Stop
│       └── StrategyMonitorPage (sub-page)
│           ├── TimeRangeSelector
│           ├── MetricsGrid []
│           │   ├── TotalPnLCard
│           │   ├── VolumeCard
│           │   ├── FillRateCard
│           │   └── SharpeRatioCard
│           ├── ChartsColumn
│           │   ├── PnLChart (LineChart)
│           │   ├── PositionChart (ComposedChart)
│           │   ├── VolumeChart (BarChart)
│           │   └── SpreadChart (LineChart)
│           └── DetailsColumn
│               ├── ActivePositionsTable
│               ├── ExchangeCoverage
│               └── RiskMetrics
│
└── AppModals.tsx
    ├── DepositModal
    │   ├── NetworkSelector
    │   ├── AmountInput
    │   ├── BalanceDisplay
    │   └── DepositButton
    ├── WithdrawModal
    │   ├── AmountInput
    │   ├── AddressInput
    │   └── WithdrawButton
    ├── TransferModal
    │   ├── DirectionSelector (To/From Exchange)
    │   ├── ExchangeSelect
    │   ├── AmountInput
    │   └── TransferButton
    └── ExchangeSelectionModal
        ├── ExchangeCheckbox []
        └── ContinueButton
```

### 2.3 Backend Architecture (Supabase)

#### Edge Functions Structure

```
/supabase/functions/
├── server/
│   ├── index.tsx                    # Main Hono app
│   ├── kv_store.tsx                 # Key-value storage utilities
│   └── fundingRateHistory.tsx       # Funding rate history management
│
├── Routes (defined in index.tsx):
│   ├── Health & Debug
│   │   ├── GET  /health
│   │   └── GET  /test
│   │
│   ├── Funding Rates
│   │   ├── GET  /funding-rates              # Current rates from Loris API
│   │   ├── POST /funding-rates/store        # Store current rates to history
│   │   ├── GET  /funding-rates/history/:token/:exchange
│   │   ├── POST /funding-rates/history/bulk # Batch history fetch
│   │   ├── POST /funding-rates/cleanup      # Prune old data
│   │   └── GET  /funding-rates/stored-pairs # Debug: list all pairs
│   │
│   ├── Binance API Proxy (CORS bypass)
│   │   ├── GET /binance/ticker/24hr         # 24hr ticker data
│   │   ├── GET /binance/ticker/price        # Current price
│   │   ├── GET /binance/klines              # Historical candles
│   │   └── GET /binance/futures/openInterest # Futures OI data
│   │
│   ├── Hyperliquid HIP-3 (RWA Assets)
│   │   ├── GET  /hyperliquid/health         # Health check with DEX validation
│   │   ├── GET  /hyperliquid/perp-dexs      # List available DEXs
│   │   ├── GET  /hyperliquid/rwa            # Get RWA universe for a DEX
│   │   ├── POST /hyperliquid/asset-details  # Batch asset details
│   │   ├── GET  /hyperliquid/candles        # Historical price data
│   │   ├── GET  /hyperliquid/orderbook      # Order book snapshot
│   │   └── GET  /hyperliquid/market-metrics # Volume, OI, funding
│   │
│   └── (Future endpoints)
│       ├── POST /orders/create
│       ├── GET  /orders/:id
│       ├── POST /orders/:id/cancel
│       ├── GET  /portfolio/summary
│       └── GET  /positions
```

#### Database Tables

```sql
-- User accounts
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Exchange API credentials (encrypted)
CREATE TABLE exchange_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  exchange TEXT NOT NULL,
  api_key TEXT NOT NULL,      -- Encrypted with Supabase Vault
  api_secret TEXT NOT NULL,   -- Encrypted with Supabase Vault
  api_passphrase TEXT,        -- For exchanges that require it
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_verified TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, exchange)
);

-- Portfolio state
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  exchange TEXT NOT NULL,
  total_equity NUMERIC(20, 8) DEFAULT 0,
  available_balance NUMERIC(20, 8) DEFAULT 0,
  margin_used NUMERIC(20, 8) DEFAULT 0,
  unrealized_pnl NUMERIC(20, 8) DEFAULT 0,
  realized_pnl NUMERIC(20, 8) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, exchange)
);

-- Positions
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  exchange TEXT NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('long', 'short')),
  size NUMERIC(20, 8) NOT NULL,
  entry_price NUMERIC(20, 8) NOT NULL,
  current_price NUMERIC(20, 8),
  unrealized_pnl NUMERIC(20, 8),
  realized_pnl NUMERIC(20, 8) DEFAULT 0,
  funding_collected NUMERIC(20, 8) DEFAULT 0,
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  exchange TEXT NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  type TEXT NOT NULL CHECK (type IN ('market', 'limit', 'twap')),
  quantity NUMERIC(20, 8) NOT NULL,
  price NUMERIC(20, 8),
  executed_quantity NUMERIC(20, 8) DEFAULT 0,
  executed_price NUMERIC(20, 8),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'partial', 'cancelled', 'failed')),
  exchange_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  filled_at TIMESTAMPTZ
);

-- Arbitrage pairs (for tracking)
CREATE TABLE arbitrage_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  long_position_id UUID REFERENCES positions(id),
  short_position_id UUID REFERENCES positions(id),
  symbol TEXT NOT NULL,
  size NUMERIC(20, 8) NOT NULL,
  entry_spread NUMERIC(10, 6),
  current_spread NUMERIC(10, 6),
  total_funding_collected NUMERIC(20, 8) DEFAULT 0,
  net_pnl NUMERIC(20, 8) DEFAULT 0,
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

-- Funding rate history (for charting)
CREATE TABLE funding_rate_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT NOT NULL,
  exchange TEXT NOT NULL,
  rate NUMERIC(10, 6) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  INDEX idx_funding_history_lookup (token, exchange, timestamp DESC)
);

-- Market maker strategies
CREATE TABLE strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('grid', 'market_making', 'funding_arb')),
  exchange TEXT NOT NULL,
  symbol TEXT NOT NULL,
  config JSONB NOT NULL,
  status TEXT DEFAULT 'stopped' CHECK (status IN ('running', 'paused', 'stopped')),
  total_pnl NUMERIC(20, 8) DEFAULT 0,
  total_volume NUMERIC(20, 8) DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Strategy performance metrics (time series)
CREATE TABLE strategy_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE,
  pnl NUMERIC(20, 8),
  volume NUMERIC(20, 8),
  trades_count INTEGER,
  fill_rate NUMERIC(5, 2),
  avg_spread NUMERIC(10, 6),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  INDEX idx_strategy_metrics (strategy_id, timestamp DESC)
);
```

#### Row-Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE arbitrage_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_metrics ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (wallet_address = auth.jwt() ->> 'wallet_address');

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (wallet_address = auth.jwt() ->> 'wallet_address');

-- Exchange credentials (highly sensitive)
CREATE POLICY "Users can manage own credentials" ON exchange_credentials
  FOR ALL USING (user_id = auth.uid());

-- Portfolios
CREATE POLICY "Users can view own portfolios" ON portfolios
  FOR SELECT USING (user_id = auth.uid());

-- Positions
CREATE POLICY "Users can manage own positions" ON positions
  FOR ALL USING (user_id = auth.uid());

-- Orders
CREATE POLICY "Users can manage own orders" ON orders
  FOR ALL USING (user_id = auth.uid());

-- Arbitrage positions
CREATE POLICY "Users can manage own arb positions" ON arbitrage_positions
  FOR ALL USING (user_id = auth.uid());

-- Strategies
CREATE POLICY "Users can manage own strategies" ON strategies
  FOR ALL USING (user_id = auth.uid());

-- Strategy metrics
CREATE POLICY "Users can view own strategy metrics" ON strategy_metrics
  FOR SELECT USING (
    strategy_id IN (
      SELECT id FROM strategies WHERE user_id = auth.uid()
    )
  );

-- Funding rate history is public (read-only)
CREATE POLICY "Anyone can view funding history" ON funding_rate_history
  FOR SELECT USING (TRUE);
```

### 2.4 Data Flow Diagrams

#### Flow 1: User Discovers Arbitrage Opportunity

```
┌─────────────┐
│   User      │
│  Opens      │
│  Explore    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  ExplorePage Component Mounts           │
│  - useFundingRates() hook triggered     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  GET /funding-rates                     │
│  - Frontend → Supabase Edge Function    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Supabase Edge Function                 │
│  - Proxies request to Loris API         │
│  GET https://api.loris.tools/funding    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Loris API Response                     │
│  {                                       │
│    "funding_rates": {                    │
│      "hyperliquid": {                    │
│        "BTC": {                          │
│          "rate_annual": 0.5475,          │
│          "rate_8h": 0.0005              │
│        }                                │
│      },                                 │
│      "paradex": { ... }                 │
│    }                                    │
│  }                                      │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Edge Function Transforms Data          │
│  - Normalize exchange names             │
│  - Convert rate formats                 │
│  - Add metadata                         │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Response to Frontend                   │
│  [                                       │
│    {                                     │
│      token: "BTC",                       │
│      exchanges: {                        │
│        hyperliquid: {                    │
│          rate: 0.0005,                   │
│          apy: 54.75                      │
│        },                                │
│        paradex: {                        │
│          rate: -0.0003,                  │
│          apy: -32.85                     │
│        }                                 │
│      }                                   │
│    }                                     │
│  ]                                       │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  useFundingRates() Updates State        │
│  - setData(transformedRates)            │
│  - setLoading(false)                    │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  ExplorePage Re-renders                 │
│  - Table populated with data            │
│  - Cells colored based on rate          │
│  - Interactive cells enabled            │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────┐
│   User      │
│  Clicks     │
│  BTC cell   │
│ (Hyperliqu.)│
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  handleCellClick()                      │
│  - Check if first or second selection   │
│  - Store in local state                 │
│  - Highlight cell (blue background)     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────┐
│   User      │
│  Clicks     │
│  BTC cell   │
│  (Paradex)  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  handleCellClick() - Second Selection   │
│  1. Validate: Same token?               │
│  2. Calculate spread                    │
│  3. Determine buy/sell exchanges        │
│  4. Create PreselectedTrade object      │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Navigate to Trade Page                 │
│  - useTradeSelection().createTrade()    │
│  - appStore.setPreselectedTrade({       │
│      buyToken: "BTC",                    │
│      buyExchange: "paradex",             │
│      sellToken: "BTC",                   │
│      sellExchange: "hyperliquid"         │
│    })                                    │
│  - window.history.pushState('/trade')   │
└─────────────────────────────────────────┘
```

#### Flow 2: Execute Arbitrage Order

```
┌─────────────┐
│   User      │
│  Arrives at │
│  Trade Page │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  FundingRateArbPage Mounts              │
│  - Reads appStore.preselectedTrade      │
│  - Pre-fills form fields                │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Form State Initialized                 │
│  buyForm = {                             │
│    exchange: "paradex",                  │
│    token: "BTC",                         │
│    orderType: "market",                  │
│    quantity: "",                         │
│    price: null                           │
│  }                                       │
│  sellForm = {                            │
│    exchange: "hyperliquid",              │
│    token: "BTC",                         │
│    orderType: "market",                  │
│    quantity: "",                         │
│    price: null                           │
│  }                                       │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────┐
│   User      │
│   Enters    │
│  Quantity   │
│   1.0 BTC   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Form Validation (Real-time)            │
│  1. Check balance on Paradex            │
│  2. Check balance on Hyperliquid        │
│  3. Calculate required margin           │
│  4. Validate: balance >= required?      │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Estimated Profit Calculation           │
│  1. Get current funding rates           │
│  2. Calculate spread                    │
│  3. Calculate daily funding             │
│  4. Display: "$87.60/day"               │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────┐
│   User      │
│   Clicks    │
│  "Submit    │
│   Multi     │
│   Order"    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Pre-Submission Validation              │
│  1. Re-validate balances                │
│  2. Check exchange connectivity         │
│  3. Validate order parameters           │
│  4. Calculate fees                      │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Show Confirmation Dialog               │
│  - Order details                        │
│  - Estimated costs/profits              │
│  - Warning messages (if any)            │
│  - "Confirm" / "Cancel" buttons         │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────┐
│   User      │
│   Clicks    │
│  "Confirm"  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Frontend: Create Order Request         │
│  const orderData = {                     │
│    type: "arbitrage",                    │
│    legs: [                               │
│      {                                   │
│        exchange: "paradex",              │
│        symbol: "BTC-PERP",               │
│        side: "buy",                      │
│        quantity: 1.0,                    │
│        orderType: "market"               │
│      },                                  │
│      {                                   │
│        exchange: "hyperliquid",          │
│        symbol: "BTC",                    │
│        side: "sell",                     │
│        quantity: 1.0,                    │
│        orderType: "market"               │
│      }                                   │
│    ]                                     │
│  }                                       │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  POST /api/v1/orders/arbitrage          │
│  - Frontend → Supabase Edge Function    │
│  - Headers: Authorization (session)     │
│  - Body: orderData (JSON)               │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Edge Function: Authenticate User       │
│  1. Verify session cookie               │
│  2. Get user_id from session            │
│  3. Check user exists                   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Edge Function: Validate Order          │
│  1. Validate order structure            │
│  2. Check supported exchanges           │
│  3. Validate symbols                    │
│  4. Check quantity > 0                  │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Edge Function: Get API Credentials     │
│  SELECT api_key, api_secret              │
│  FROM exchange_credentials               │
│  WHERE user_id = $1                      │
│    AND exchange IN ('paradex',           │
│                     'hyperliquid')       │
│    AND is_active = TRUE                  │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Edge Function: Execute LEG 1 (Paradex) │
│  1. Construct Paradex order request     │
│  2. Sign request with API credentials   │
│  3. POST to Paradex API                 │
│  4. Wait for response                   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Paradex API Response                   │
│  {                                       │
│    "order_id": "pdx_123456",            │
│    "status": "filled",                   │
│    "filled_qty": 1.0,                    │
│    "avg_fill_price": 45123.50           │
│  }                                       │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Edge Function: Execute LEG 2 (Hyperliqu│
│  1. Construct Hyperliquid order         │
│  2. Sign request with private key       │
│  3. POST to Hyperliquid API             │
│  4. Wait for response                   │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Hyperliquid API Response               │
│  {                                       │
│    "status": "ok",                       │
│    "response": {                         │
│      "type": "order",                    │
│      "data": {                           │
│        "statuses": [{                    │
│          "filled": {                     │
│            "totalSz": "1.0",             │
│            "avgPx": "45125.00"           │
│          }                               │
│        }]                                │
│      }                                   │
│    }                                     │
│  }                                       │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Edge Function: Store Orders in DB      │
│  INSERT INTO orders (user_id, exchange, │
│    symbol, side, type, quantity, price, │
│    executed_quantity, executed_price,   │
│    status, exchange_order_id)           │
│  VALUES (...), (...)                     │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Edge Function: Create Positions        │
│  INSERT INTO positions (user_id,        │
│    exchange, symbol, side, size,        │
│    entry_price, current_price)          │
│  VALUES (...), (...)                     │
│  RETURNING id                            │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Edge Function: Link Arbitrage Pair     │
│  INSERT INTO arbitrage_positions        │
│    (user_id, long_position_id,          │
│     short_position_id, symbol, size,    │
│     entry_spread)                        │
│  VALUES (...)                            │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Edge Function: Return Response         │
│  {                                       │
│    "success": true,                      │
│    "arbitrage_id": "uuid-...",          │
│    "legs": [                             │
│      {                                   │
│        "exchange": "paradex",            │
│        "order_id": "pdx_123456",        │
│        "status": "filled",               │
│        "filled_price": 45123.50         │
│      },                                  │
│      {                                   │
│        "exchange": "hyperliquid",        │
│        "order_id": "hl_789012",         │
│        "status": "filled",               │
│        "filled_price": 45125.00         │
│      }                                   │
│    ],                                    │
│    "entry_spread": 0.0003,              │
│    "estimated_daily_funding": 87.60     │
│  }                                       │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Frontend: Handle Success               │
│  1. Close confirmation dialog           │
│  2. Show success toast                  │
│  3. Update local state                  │
│  4. Navigate to Portfolio page          │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────┐
│   User      │
│   Sees      │
│  Portfolio  │
│   Updated   │
└─────────────┘
```

---

## 3. Technology Stack Specifications

### 3.1 Frontend Dependencies

#### package.json (Complete)

```json
{
  "name": "bitfrost-frontend",
  "version": "3.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css}\"",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  },
  "dependencies": {
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-collapsible": "^1.0.3",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-popover": "^1.0.7",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-tooltip": "^1.0.7",
    "@rainbow-me/rainbowkit": "^2.2.4",
    "@tanstack/react-query": "^5.62.3",
    "axios": "^1.6.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "hono": "^4.3.0",
    "lucide-react": "^0.316.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.55.0",
    "recharts": "^2.12.0",
    "sonner": "^1.3.1",
    "tailwind-merge": "^2.2.1",
    "tailwindcss-animate": "^1.0.7",
    "viem": "^2.7.0",
    "wagmi": "^2.15.1",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.16",
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.19",
    "@typescript-eslint/eslint-plugin": "^6.21.0",
    "@typescript-eslint/parser": "^6.21.0",
    "@vitejs/plugin-react": "^4.2.1",
    "@vitest/ui": "^1.2.2",
    "autoprefixer": "^10.4.17",
    "eslint": "^8.56.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.35",
    "prettier": "^3.2.5",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.4.0",
    "vite": "^5.1.0",
    "vitest": "^1.2.2"
  }
}
```

#### Key Library Versions & Why

1. **React 18.3.1**
   - Concurrent rendering for better performance
   - Automatic batching reduces re-renders
   - Suspense for data fetching (future-ready)

2. **TypeScript 5.4.0**
   - Latest type inference improvements
   - Better error messages
   - Faster type checking

3. **Vite 5.1.0**
   - Fastest build tool available
   - Hot Module Replacement (HMR) in <100ms
   - Optimized production builds

4. **Wagmi 2.15.1 + Viem 2.7.0**
   - Modern Web3 React hooks
   - TypeScript-first design
   - Better than ethers.js/web3.js
   - Tree-shakeable (smaller bundle)

5. **RainbowKit 2.2.4**
   - Best wallet connection UX
   - Supports 300+ wallets
   - Beautiful UI out of the box
   - Mobile-first design

6. **Zustand 4.5.0**
   - Simplest state management (vs Redux)
   - No boilerplate
   - Excellent TypeScript support
   - Middleware for persistence

7. **Tailwind CSS 4.0.0**
   - Latest version with performance improvements
   - Better IDE integration
   - Smaller CSS output

8. **Recharts 2.12.0**
   - Most popular React charting library
   - Responsive by default
   - Easy to customize
   - Good performance with large datasets

9. **Axios 1.6.0**
   - Better than fetch API
   - Automatic request/response interceptors
   - Better error handling
   - Request cancellation support

10. **React Hook Form 7.55.0**
    - Best form library for React
    - Excellent performance (fewer re-renders)
    - Built-in validation
    - TypeScript support

### 3.2 Backend Dependencies (Deno)

#### import_map.json (Deno imports)

```json
{
  "imports": {
    "hono": "https://deno.land/x/hono@v4.3.0/mod.ts",
    "hono/cors": "https://deno.land/x/hono@v4.3.0/middleware/cors/index.ts",
    "hono/logger": "https://deno.land/x/hono@v4.3.0/middleware/logger/index.ts"
  }
}
```

#### Why Deno + Hono?

1. **Deno Runtime**
   - Modern JavaScript/TypeScript runtime
   - Built-in TypeScript support (no compilation step)
   - Secure by default (explicit permissions)
   - Web-standard APIs (fetch, Request, Response)
   - Fast startup time (<5ms)

2. **Hono Framework**
   - Fastest web framework for Deno
   - Express-like API (easy to learn)
   - Built-in middleware
   - Excellent TypeScript support
   - Tiny bundle size (~12KB)

3. **Supabase Edge Functions**
   - Serverless (no server management)
   - Global CDN deployment
   - Auto-scaling
   - Free tier: 500K invocations/month
   - <200ms cold start

### 3.3 Configuration Files

#### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
  server: {
    port: 5173,
    host: true,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'wagmi-vendor': ['wagmi', 'viem', '@rainbow-me/rainbowkit'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'chart-vendor': ['recharts'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'wagmi', 'viem'],
  },
});
```

#### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@services/*": ["./src/services/*"],
      "@stores/*": ["./src/stores/*"],
      "@types/*": ["./src/types/*"],
      "@utils/*": ["./src/utils/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

#### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Light theme
        'bg-primary': '#F7F5EF',
        'bg-secondary': '#FFFFFF',
        'bg-surface': '#FAFAF8',
        'bg-subtle': '#F0EEE8',
        'bg-hover': '#E8E6E0',
        
        // Dark theme
        'dark-bg-primary': '#0a0a0a',
        'dark-bg-secondary': '#151515',
        'dark-bg-surface': '#1a1a1a',
        'dark-bg-subtle': '#202020',
        'dark-bg-hover': '#2a2a2a',
        
        // Text
        'text-primary': '#18181B',
        'text-secondary': '#52525B',
        'text-tertiary': '#A1A1AA',
        
        // Borders
        'border-default': '#E4E4E7',
        'border-primary': '#D4D4D8',
        
        // Accent colors
        'accent-positive': '#1FBF75',
        'accent-negative': '#E24A4A',
        'accent-neutral': '#3B82F6',
        
        // Button
        'button-primary': '#C9A36A',
        'button-primary-hover': '#B8925A',
        
        // Custom shadows
        'shadow-elevation': '0 1px 3px 0 rgb(0 0 0 / 0.1)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
      },
      fontSize: {
        'xs': '11px',
        'sm': '12px',
        'base': '13px',
        'lg': '14px',
        'xl': '16px',
        '2xl': '18px',
        '3xl': '24px',
        '4xl': '32px',
      },
      spacing: {
        // 8-point grid system
        '0.5': '4px',
        '1': '8px',
        '1.5': '12px',
        '2': '16px',
        '2.5': '20px',
        '3': '24px',
        '4': '32px',
        '5': '40px',
        '6': '48px',
        '8': '64px',
        '10': '80px',
        '12': '96px',
      },
      borderRadius: {
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
};
```

#### .env.example

```bash
# API Configuration
VITE_API_BASE_URL=https://api.prime.testnet.bitfrost.ai
VITE_WS_URL=wss://api.prime.testnet.bitfrost.ai/ws

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Wallet Connect
VITE_WALLET_CONNECT_PROJECT_ID=your-project-id

# Blockchain
VITE_CHAIN_ID=999
VITE_NETWORK_NAME=HyperEVM Mainnet
VITE_RPC_URL=https://rpc.hyperliquid-testnet.xyz/evm

# Environment
VITE_ENVIRONMENT=production
VITE_LOG_LEVEL=info

# Feature Flags
VITE_ENABLE_MARKET_MAKER=true
VITE_ENABLE_ANALYTICS=true
```

---

## 4. Development Environment Setup

### 4.1 Prerequisites

#### Required Software

1. **Node.js 18.x or higher**
   ```bash
   # Check version
   node --version  # Should be v18.0.0 or higher
   
   # Install via nvm (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   nvm use 18
   ```

2. **npm 10.x or higher**
   ```bash
   # Check version
   npm --version  # Should be 10.0.0 or higher
   
   # Update npm
   npm install -g npm@latest
   ```

3. **Git**
   ```bash
   # Check version
   git --version
   
   # Install on macOS
   brew install git
   
   # Install on Ubuntu
   sudo apt-get install git
   ```

4. **Supabase CLI**
   ```bash
   # Install
   npm install -g supabase
   
   # Verify
   supabase --version
   ```

5. **VS Code (recommended)**
   - Download from: https://code.visualstudio.com/
   - Extensions to install:
     - ESLint
     - Prettier
     - Tailwind CSS IntelliSense
     - TypeScript Vue Plugin (Volar)
     - Error Lens

#### Optional (but recommended)

1. **Deno (for local Supabase development)**
   ```bash
   # Install
   curl -fsSL https://deno.land/install.sh | sh
   
   # Verify
   deno --version
   ```

2. **Docker (for local Supabase)**
   ```bash
   # Install Docker Desktop
   # macOS: https://docs.docker.com/desktop/mac/install/
   # Windows: https://docs.docker.com/desktop/windows/install/
   # Linux: https://docs.docker.com/engine/install/
   
   # Verify
   docker --version
   ```

### 4.2 Clone and Setup

#### Step 1: Clone Repository

```bash
# Clone from GitHub
git clone https://github.com/your-org/bitfrost.git
cd bitfrost

# Or if starting from scratch
mkdir bitfrost
cd bitfrost
git init
```

#### Step 2: Install Dependencies

```bash
# Install all npm dependencies
npm install

# This will install:
# - React, TypeScript, Vite
# - Wagmi, Viem, RainbowKit (Web3)
# - Zustand, React Query (State)
# - Radix UI components
# - Recharts
# - All dev dependencies
```

#### Step 3: Environment Configuration

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your actual values
nano .env  # or use your preferred editor
```

**Required values**:

1. **VITE_SUPABASE_URL**: Get from Supabase dashboard
2. **VITE_SUPABASE_ANON_KEY**: Get from Supabase dashboard
3. **VITE_WALLET_CONNECT_PROJECT_ID**: Create at https://cloud.walletconnect.com/

#### Step 4: Initialize Supabase

```bash
# Login to Supabase CLI
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Pull remote schema (if project already exists)
supabase db pull

# Or initialize new project
supabase init
```

#### Step 5: Database Setup

```bash
# Apply migrations
supabase db push

# Or run migrations manually
supabase migration new init_schema
# Edit the migration file in supabase/migrations/
supabase db push
```

**Migration file example** (`supabase/migrations/20260206000000_init_schema.sql`):

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  preferences JSONB DEFAULT '{}'::jsonb
);

-- (Include all other tables from Section 2.3)
-- ...

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- (Include all RLS policies from Section 2.3)
-- ...
```

#### Step 6: Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy

# Or deploy specific function
supabase functions deploy server

# Set environment variables for edge functions
supabase secrets set HIP3_DEX_NAME=xyz
```

#### Step 7: Start Development Server

```bash
# Start frontend dev server
npm run dev

# Open browser to http://localhost:5173
```

### 4.3 Development Workflow

#### Daily Workflow

```bash
# 1. Pull latest changes
git pull origin main

# 2. Install any new dependencies
npm install

# 3. Start dev server
npm run dev

# 4. Make changes and test

# 5. Type check
npm run type-check

# 6. Lint
npm run lint

# 7. Format
npm run format

# 8. Commit
git add .
git commit -m "feat: add new feature"

# 9. Push
git push origin your-branch
```

#### Git Workflow (Gitflow)

```bash
# Create feature branch
git checkout -b feature/funding-rate-chart

# Make changes and commit
git add .
git commit -m "feat: add funding rate historical chart"

# Push to remote
git push origin feature/funding-rate-chart

# Create pull request on GitHub

# After approval, merge to main
git checkout main
git merge feature/funding-rate-chart
git push origin main
```

#### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

Examples:
```
feat(explore): add funding rate sorting
fix(trade): resolve balance validation bug
docs(readme): update setup instructions
refactor(api): simplify error handling
test(orders): add unit tests for order creation
```

### 4.4 Troubleshooting Common Issues

#### Issue 1: "Cannot find module '@/components/...'"

**Solution**: Path aliases not configured

```bash
# Verify tsconfig.json has paths configured
# See section 3.3 for correct configuration

# Restart TypeScript server in VS Code
# Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows)
# Type: "TypeScript: Restart TS Server"
```

#### Issue 2: "CORS error when calling Supabase"

**Solution**: Check Supabase CORS configuration

```bash
# In Supabase Dashboard:
# Settings → API → CORS Configuration
# Add: http://localhost:5173
```

#### Issue 3: "Wallet connection not working"

**Solution**: Check WalletConnect Project ID

```bash
# Verify VITE_WALLET_CONNECT_PROJECT_ID in .env
# Get new ID from https://cloud.walletconnect.com/ if needed

# Restart dev server after changing .env
npm run dev
```

#### Issue 4: "Edge function not found"

**Solution**: Deploy edge functions

```bash
# Deploy all functions
supabase functions deploy

# Verify deployment
supabase functions list
```

#### Issue 5: "Database table not found"

**Solution**: Run migrations

```bash
# Check migration status
supabase migration list

# Apply pending migrations
supabase db push

# Or reset database (CAUTION: deletes all data)
supabase db reset
```

---

*End of Part 1 (Foundation)*

*This document continues in Part 2 with complete user journey specifications, UI specifications, and design system details...*

