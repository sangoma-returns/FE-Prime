# Bitfrost - Detailed Architecture Documentation

> **Version**: 1.0.0  
> **Last Updated**: January 21, 2026  
> **Application**: Funding Rate Arbitrage Platform (MVP)

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Layers](#architecture-layers)
4. [Core Components](#core-components)
5. [State Management](#state-management)
6. [Data Flow](#data-flow)
7. [API Integration](#api-integration)
8. [Routing & Navigation](#routing--navigation)
9. [Authentication Flow](#authentication-flow)
10. [Component Hierarchy](#component-hierarchy)
11. [File Structure](#file-structure)
12. [Design System](#design-system)
13. [Key Features](#key-features)

---

## System Overview

**Bitfrost** is a professional-grade funding rate arbitrage application built with React, TypeScript, and Vite. It enables users to:

- Connect wallets via RainbowKit (WalletConnect, Coinbase Wallet)
- Deposit USDC from HyperEVM (testnet: 998, mainnet: 999)
- Select and allocate funds across multiple exchanges (Hyperliquid, Paradex, Aster, Binance, Bybit, OKX)
- Monitor funding rates and execute arbitrage strategies
- Track portfolio performance with comprehensive analytics
- Manage market maker strategies with detailed monitoring

### Architecture Principles

- **Modular Component Design**: Each component has a single responsibility
- **Centralized State Management**: Zustand stores for predictable state updates
- **Type-Safe API Layer**: Full TypeScript coverage with typed API responses
- **Graceful Degradation**: Backend-optional design with fallback to wallet-only mode
- **Custom Routing**: Browser History API-based navigation (no React Router dependency issues)

---

## Technology Stack

### Core Framework
```
React 18.3.0          - UI library
TypeScript 5.4.0      - Type safety
Vite 5.x              - Build tool and dev server
```

### Web3 Integration
```
Wagmi 2.15.1          - Web3 React hooks
RainbowKit 2.2.4      - Wallet connection UI
Viem 2.7.0            - Ethereum interactions
```

### State Management
```
Zustand 4.5.0         - Global state management
TanStack Query 5.x    - Server state management
```

### UI & Styling
```
Tailwind CSS 4.0      - Utility-first CSS
Radix UI              - Unstyled accessible components
Lucide React          - Icon system
Recharts 2.12.0       - Data visualization
Sonner 2.0.3          - Toast notifications
```

### API & Data
```
Axios 1.6.0           - HTTP client
React Hook Form 7.55  - Form management
```

### Development
```
ESLint 8.57           - Code linting
PostCSS 8.4           - CSS processing
```

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│  - React Components (UI)                                     │
│  - Pages (Portfolio, Explore, Trade, Market Maker)          │
│  - Modals (Deposit, Withdraw, Transfer, Exchange Selection) │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      BUSINESS LOGIC LAYER                    │
│  - Custom Hooks (useAuth, usePortfolio, useFundingRates)   │
│  - State Management (Zustand Stores)                        │
│  - Form Validation (React Hook Form)                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       DATA ACCESS LAYER                      │
│  - API Services (client.ts, authApi.ts)                    │
│  - WebSocket Service (websocket.ts)                        │
│  - Type Definitions (types/index.ts)                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      INFRASTRUCTURE LAYER                    │
│  - Wagmi Configuration (Web3)                               │
│  - Axios Interceptors (Auth, Logging)                      │
│  - Environment Configuration (.env)                        │
│  - Build Configuration (Vite, TypeScript)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Components

### Application Shell

#### `/App.tsx` - Main Application Component
- **Purpose**: Root component with providers and global state
- **Responsibilities**:
  - Wraps app with RainbowKit, Wagmi, and TanStack Query providers
  - Manages theme switching (light/dark)
  - Handles wallet connection/disconnection
  - Coordinates modal state
  - Manages onboarding flow state
  - Orchestrates navigation

**Key Features**:
```typescript
- QueryClient provider (React Query)
- WagmiProvider (Web3)
- RainbowKitProvider (Wallet UI)
- AppContent (main app logic)
- Toast notifications (Sonner)
- Navigation component
- AppRouter (page routing)
- AppModals (modal management)
```

#### `/components/Navigation/Navigation.tsx`
- **Purpose**: Top navigation bar with wallet connection and theme toggle
- **Features**:
  - Page navigation (Explore, Trade, Market Maker, Portfolio)
  - Wallet connection status
  - Disconnect button
  - Theme toggle (light/dark)
  - Notifications dropdown with unread indicator
  - Custom browser history integration

#### `/components/AppRouter/AppRouter.tsx`
- **Purpose**: Custom client-side routing solution
- **Why Custom?**: Resolved persistent React Router build errors in Figma Make environment
- **Features**:
  - Browser History API-based navigation
  - Supports back/forward browser buttons
  - No external routing dependencies
  - Conditional rendering based on pathname
  - Routes: `/explore`, `/trade`, `/market-maker`, `/portfolio`

---

### Page Components

#### 1. **Portfolio Page** (`/components/PortfolioPage/PortfolioPage.tsx`)
**Purpose**: Main dashboard for portfolio overview and account management

**Features**:
- Portfolio summary (total equity, PnL, directional bias)
- Exchange balance display with allocation percentages
- Quick action buttons (Deposit, Withdraw, Transfer)
- Active orders section
- Exchange configuration management
- Strategy monitoring navigation

**Sub-components**:
- `PortfolioOverview.tsx` - Summary metrics
- `PortfolioExchanges.tsx` - Exchange balances with charts
- `TradeHistory.tsx` - Historical trades table
- `TradeDetailView.tsx` - Individual trade details

**State Management**:
- Uses `usePortfolio` hook for data fetching
- Integrates with `useAppStore` for balances
- Handles modal triggers for deposits/withdrawals

---

#### 2. **Explore Page** (`/components/ExplorePage.tsx`)
**Purpose**: Funding rate discovery and trade selection interface

**Features**:
- Multi-exchange funding rate comparison table
- Real-time funding rate updates
- Interactive cell selection (click two cells to create arbitrage)
- Selected cells highlight in blue
- Automatic navigation to Trade page with pre-filled data
- Token filtering and sorting
- Exchange enablement awareness (only selected exchanges clickable)

**Key Workflow**:
```
1. User clicks funding rate cell (e.g., BTC on Hyperliquid: +0.05%)
2. Cell highlights in blue
3. User clicks second cell (e.g., BTC on Paradex: -0.03%)
4. System calculates arbitrage opportunity
5. Navigates to /trade with:
   - buyToken: "BTC"
   - buyExchange: "paradex" (lower rate)
   - sellToken: "BTC"
   - sellExchange: "hyperliquid" (higher rate)
```

**State Management**:
- `useFundingRates` hook for rate data
- Local state for cell selection
- `useTradeSelection` hook for navigation logic

---

#### 3. **Trade Page / Funding Arb Page** (`/components/FundingRateArbPage.tsx`)
**Purpose**: Execute funding rate arbitrage trades

**Features**:
- Dual-panel order form (Buy + Sell)
- Exchange pair selector with pre-selection support
- Order type selection (Market, Limit, TWAP, Multi)
- Quantity and price inputs
- Duration selector for TWAP orders
- Real-time estimated profit/loss
- Order confirmation before execution
- Multi-order support (batch trades)

**Components**:
- `ExchangePairSelector` - Exchange/pair selection dropdowns
- `MultiOrderConfirmation` - Confirmation dialog for orders

**Props**:
```typescript
{
  enabledExchanges: string[]          // Selected exchanges from onboarding
  onCreateOrder: (order) => void      // Order creation handler
  preselectedTrade: PreselectedTrade  // From Explore page navigation
  onOpenDeposit: () => void           // Modal triggers
  onOpenWithdraw: () => void
  onOpenTransfer: () => void
}
```

---

#### 4. **Market Maker Page** (`/components/MarketMakerPage/MarketMakerPage.tsx`)
**Purpose**: Market making strategy configuration and management

**Features**:
- Strategy creation form
- Active strategies grid
- Performance metrics per strategy
- Strategy detail navigation

**Sub-component**:
- `StrategyMonitorPage` - Detailed strategy analytics

---

#### 5. **Strategy Monitor Page** (`/components/StrategyMonitorPage/StrategyMonitorPage.tsx`)
**Purpose**: Comprehensive strategy performance monitoring

**Features**:
- Time-range selector (1h, 4h, 24h, 7d)
- Key metrics grid (Total PnL, Volume, Position, Avg Spread, Fill Rate, Sharpe Ratio)
- Multiple Recharts visualizations:
  - **PnL Over Time**: LineChart (Realized, Unrealized, Net)
  - **Position & Exposure**: ComposedChart (Long/Short bars + Net line)
  - **Volume & Activity**: ComposedChart (Bar + Line dual-axis)
  - **Order Book Imbalance**: ComposedChart (Bid/Ask bars + Imbalance line)
  - **Spread & Fill Rate**: ComposedChart (Dual-axis metrics)
- Active positions table
- Exchange coverage breakdown
- Risk metrics panel

**Data Generation**:
- Mock time-series data with realistic patterns
- 48-168 data points based on time range
- Simulated trading activity with random walks

**Theme Integration**:
- Dynamic chart colors based on light/dark theme
- Consistent with global design system

---

### Modal Components

#### `/components/DepositModal/DepositModal.tsx`
**Features**:
- USDC deposit from HyperEVM
- Amount input with min/max validation
- Network selection (testnet/mainnet)
- Real-time balance checking
- Transaction confirmation

#### `/components/WithdrawModal/WithdrawModal.tsx`
**Features**:
- Withdraw USDC to wallet
- Available balance display
- Withdrawal amount validation
- Destination address input

#### `/components/TransferModal/TransferModal.tsx`
**Features**:
- Transfer between vault and exchanges
- Direction selector (To Exchange / From Exchange)
- Exchange selection dropdown
- Amount validation against available balance

#### `/components/ExchangeSelectionModal/ExchangeSelectionModal.tsx`
**Features**:
- Multi-select exchange checkboxes
- Exchange logos and display names
- Allocation preview (equal distribution)
- Onboarding flow integration

---

### Shared UI Components

Located in `/components/ui/` - shadcn/ui components adapted for Vite:

```
accordion.tsx       - Collapsible sections
alert-dialog.tsx    - Confirmation dialogs
button.tsx          - Primary button component
card.tsx            - Card container
chart.tsx           - Recharts wrapper components
checkbox.tsx        - Checkbox input
dialog.tsx          - Modal dialogs
dropdown-menu.tsx   - Dropdown menus
input.tsx           - Text input
label.tsx           - Form labels
select.tsx          - Select dropdowns
separator.tsx       - Divider lines
switch.tsx          - Toggle switch
table.tsx           - Data tables
tabs.tsx            - Tab navigation
textarea.tsx        - Multi-line text input
tooltip.tsx         - Hover tooltips
```

**Note**: These components include `"use client"` directives (Next.js artifact) which are safely ignored by Vite.

---

## State Management

### Zustand Stores

#### 1. **App Store** (`/stores/appStore.ts`)
**Purpose**: Core application state

**State**:
```typescript
{
  hasDeposited: boolean                    // Onboarding step 1 complete
  hasBitfrostAccount: boolean              // Onboarding step 2 complete
  depositAmount: number                    // Vault balance (USDC)
  selectedExchanges: string[]              // User-selected exchanges
  activeOrder: Order | null                // Currently active order
  preselectedTrade: PreselectedTrade | null // From Explore page
  exchangeAllocations: Record<string, number> // Exchange -> balance mapping
}
```

**Actions**:
```typescript
disconnectWallet()              // Reset state on wallet disconnect
completeDeposit(amount)         // Mark deposit complete, set amount
setupExchanges(exchanges[])     // Allocate funds to exchanges
createOrder(order)              // Set active order
clearOrder()                    // Clear active order
setPreselectedTrade(trade)      // Set trade from Explore page
updateDepositAmount(amount)     // Update vault balance
transferFunds(exchange, amount, direction) // Move funds between vault/exchange
```

**Key Logic**:
- When `setupExchanges()` is called:
  - Divides `depositAmount` equally among selected exchanges
  - Sets `exchangeAllocations` with per-exchange balances
  - Sets vault `depositAmount` to 0 (all funds allocated)
  - Marks `hasBitfrostAccount = true`

---

#### 2. **Auth Store** (`/stores/authStore.ts`)
**Purpose**: Authentication state management

**State**:
```typescript
{
  isAuthenticated: boolean
  user: User | null
  isLoading: boolean
  status: 'loading' | 'authenticated' | 'unauthenticated'
}
```

**Actions**:
```typescript
setUser(user)      // Set user and mark authenticated
clearUser()        // Clear user and mark unauthenticated
setLoading(bool)   // Set loading state
setStatus(status)  // Set auth status
```

**Integration**:
- Works with SIWE (Sign-In with Ethereum) authentication
- HTTP-only cookie sessions from backend
- Graceful fallback to wallet-only mode if backend unavailable

---

#### 3. **Theme Store** (`/stores/themeStore.ts`)
**Purpose**: Theme management with localStorage persistence

**State**:
```typescript
{
  theme: 'light' | 'dark'
  colors: ThemeColors  // Computed based on theme
}
```

**Actions**:
```typescript
toggleTheme()       // Switch between light/dark
setTheme(theme)     // Set specific theme
```

**Color System**:
```typescript
ThemeColors {
  bg: { primary, secondary, surface, subtle, hover }
  text: { primary, secondary, tertiary, hoverPrimary }
  border: { default, primary, secondary, divider }
  accent: { positive, negative, neutral }
  button: { primaryBg, primaryText, dangerBg, dangerText }
  input: { bg, border, text, placeholder }
  state: { hover, active, focus }
}
```

**Light Theme**:
- Primary BG: `#F7F5EF` (warm off-white)
- Primary Button: `#C9A36A` (golden brass)
- Positive: `#1FBF75` (green)
- Negative: `#E24A4A` (red)

**Dark Theme**:
- Primary BG: `#0a0a0a` (near black)
- Primary Button: `#C9A36A` (golden brass, same)
- Positive/Negative: Standard green/red

**Features**:
- localStorage persistence via Zustand middleware
- Document class updates (`dark` class on `<html>`)
- Rehydration on page load

---

## Data Flow

### Typical User Flow

```
┌─────────────────┐
│  User Connects  │
│     Wallet      │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  SIWE Auth      │  ← authApi.getNonce() → Backend
│  (Optional)     │  ← authApi.login()    → Backend
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Onboarding 1   │
│  Deposit USDC   │  ← User inputs amount
└────────┬────────┘  ← completeDeposit() updates appStore
         │
         ↓
┌─────────────────┐
│  Onboarding 2   │
│ Select Exchanges│  ← User selects exchanges
└────────┬────────┘  ← setupExchanges() allocates funds
         │
         ↓
┌─────────────────┐
│  Explore Page   │  ← useFundingRates() fetches rates
│  View Rates     │  ← User clicks 2 cells
└────────┬────────┘  ← setPreselectedTrade()
         │
         ↓
┌─────────────────┐
│   Trade Page    │  ← Pre-filled from preselectedTrade
│  Execute Arb    │  ← User reviews/submits order
└────────┬────────┘  ← createOrder() → API
         │
         ↓
┌─────────────────┐
│ Portfolio Page  │  ← usePortfolio() fetches data
│  Monitor PnL    │  ← Displays active orders, balances
└─────────────────┘
```

---

### Data Fetching Flow

#### Portfolio Data
```
Component (PortfolioPage)
    ↓
usePortfolio() hook
    ↓
/services/api/portfolio.ts
    ↓
apiClient.get('/portfolio/summary')
    ↓
Backend API (api.prime.testnet.bitfrost.ai)
    ↓
Response → useState in hook
    ↓
Component re-renders with data
```

#### Funding Rates
```
Component (ExplorePage)
    ↓
useFundingRates() hook
    ↓
/services/api/funding.ts
    ↓
apiClient.get('/funding-rates')
    ↓
Backend API
    ↓
Response → Mock data fallback if error
    ↓
Component renders table
```

---

## API Integration

### Backend Configuration

**Base URL**: `https://api.prime.testnet.bitfrost.ai`  
**Note**: This URL must never be changed (per requirements)

### API Client (`/services/api/client.ts`)

**Features**:
- Centralized Axios instance
- Request/response interceptors
- Automatic error handling
- HTTP-only cookie support (`withCredentials: true`)
- TypeScript-typed request helpers

**Request Interceptor**:
```typescript
- Adds X-Request-Time header
- Logs requests in development
- Error handling
```

**Response Interceptor**:
```typescript
- Logs responses in development
- Handles 401 (Unauthorized) - session expired
- Handles 403 (Forbidden) - insufficient permissions
- Handles 429 (Rate Limit) - automatic retry with delay
- Handles 5xx (Server Errors) - logs and rejects
```

**Typed Helpers**:
```typescript
get<T>(url, config?)     → Promise<T>
post<T>(url, data, config?) → Promise<T>
put<T>(url, data, config?)  → Promise<T>
del<T>(url, config?)     → Promise<T>
patch<T>(url, data, config?) → Promise<T>
```

---

### Auth API (`/lib/authApi.ts`)

**Purpose**: Specialized API client for authentication endpoints

**Two Axios Instances**:

1. **Public API** (`publicApi`)
   - `withCredentials: false`
   - Used for: `/api/v1/auth/nonce`
   - No cookies sent/received

2. **Authenticated API** (`authenticatedApi`)
   - `withCredentials: true`
   - Used for: `/api/v1/auth/login`, `/api/v1/auth/me`, `/api/v1/auth/logout`, `/api/v1/account`
   - HTTP-only cookies sent/received

**Endpoints**:

```typescript
// PUBLIC
getNonce() → Promise<string>
  - GET /api/v1/auth/nonce
  - Returns nonce for SIWE message signing

// AUTHENTICATED
login(request) → Promise<LoginResponse>
  - POST /api/v1/auth/login
  - Body: { message: string, signature: string }
  - Backend sets HTTP-only session cookie

getSession() → Promise<SessionResponse | null>
  - GET /api/v1/auth/me
  - Returns current session or null if 401/403

logout() → Promise<void>
  - POST /api/v1/auth/logout
  - Backend clears session cookie

getAccount() → Promise<AccountResponse>
  - GET /api/v1/account
  - Returns user account data
```

**Error Handling**:
- Custom `AuthApiError` class
- Network errors treated as "no session" (graceful degradation)
- CORS errors logged with helpful debug info

---

### Other API Services

#### `/services/api/exchanges.ts`
- `getExchanges()` - Fetch available exchanges
- `connectExchange()` - Link exchange account
- `disconnectExchange()` - Unlink exchange

#### `/services/api/funding.ts`
- `getFundingRates()` - Fetch current funding rates
- `getFundingHistory()` - Historical funding rate data

#### `/services/api/orders.ts`
- `createOrder()` - Submit new order
- `getOrders()` - Fetch order history
- `getOrderById()` - Fetch single order
- `cancelOrder()` - Cancel pending order

#### `/services/api/portfolio.ts`
- `getPortfolioSummary()` - Portfolio overview
- `getExchangeBalances()` - Per-exchange balances
- `getPositions()` - Active positions

---

### WebSocket Service (`/services/websocket.ts`)

**Purpose**: Real-time updates for prices, funding rates, and order status

**Features**:
- Auto-reconnect on disconnect
- Heartbeat/ping-pong
- Event subscription system
- Message type routing

**Usage**:
```typescript
import { websocketService } from './services/websocket';

// Connect
websocketService.connect();

// Subscribe to events
websocketService.on('price_update', (data) => {
  console.log('New price:', data);
});

// Unsubscribe
websocketService.off('price_update', handler);

// Disconnect
websocketService.disconnect();
```

---

## Routing & Navigation

### Custom Routing System

**Why Custom?**
- Resolved persistent React Router build errors in Figma Make environment
- Simpler implementation with direct browser API control
- No external dependencies = fewer build issues

**Implementation**: `/components/AppRouter/AppRouter.tsx`

**Routes**:
```typescript
/explore       → ExplorePage
/trade         → FundingRateArbPage
/market-maker  → MarketMakerPage
/portfolio     → PortfolioPage
```

**Navigation Hook**: `/hooks/useNavigation.ts`

```typescript
const { currentPage, navigateTo } = useNavigation();

// Navigate to explore page
navigateTo('explore');

// Current page
currentPage // 'explore' | 'portfolio' | 'funding-arb' | 'market-maker'
```

**Browser Integration**:
- Uses `window.history.pushState()` for navigation
- Listens to `popstate` event for back/forward buttons
- Updates pathname state on navigation
- Full browser history support

**Navigation Component Integration**:
```typescript
// In Navigation.tsx
navItems.map(item => (
  <button
    onClick={() => {
      window.history.pushState({}, '', item.path);
      onNavigate(item.page);
    }}
  >
    {item.label}
  </button>
))
```

---

## Authentication Flow

### SIWE (Sign-In with Ethereum)

**Flow**:

```
1. User connects wallet (RainbowKit)
   ↓
2. useSessionRestore() checks for existing session
   - GET /api/v1/auth/me
   - If session exists → setUser()
   - If no session → continue to step 3
   ↓
3. Backend authentication (if enabled)
   a. GET /api/v1/auth/nonce → nonce
   b. User signs SIWE message with wallet
   c. POST /api/v1/auth/login { message, signature }
   d. Backend verifies signature, sets HTTP-only cookie
   e. setUser() with user data
   ↓
4. Authenticated session
   - All API requests include session cookie
   - Session persists across page refreshes
   ↓
5. User disconnects wallet
   - POST /api/v1/auth/logout
   - clearUser() in authStore
   - disconnectWallet() in appStore
```

**Graceful Degradation**:
- If backend unavailable, app works in wallet-only mode
- All features functional without backend auth
- Mock data used for development/testing

---

### Session Restore Hook (`/hooks/useSessionRestore.ts`)

**Purpose**: Automatically restore session on page load

```typescript
useEffect(() => {
  if (isConnected && !isAuthenticated) {
    // Try to restore session
    getSession().then(session => {
      if (session) {
        setUser({ address: session.address });
      }
    });
  }
}, [isConnected, isAuthenticated]);
```

---

## Component Hierarchy

```
App.tsx
├── RainbowKitProvider
│   ├── Navigation
│   │   ├── Logo
│   │   ├── NavItems (Explore, Trade, Market Maker, Portfolio)
│   │   ├── CustomConnectButton (Wallet)
│   │   ├── ThemeToggle
│   │   └── Notifications
│   │
│   ├── AppRouter
│   │   ├── ExplorePage
│   │   │   └── Funding Rate Table
│   │   │
│   │   ├── FundingRateArbPage (Trade)
│   │   │   ├── ExchangePairSelector (Buy)
│   │   │   ├── ExchangePairSelector (Sell)
│   │   │   └── MultiOrderConfirmation
│   │   │
│   │   ├── MarketMakerPage
│   │   │   ├── Strategy List
│   │   │   └── Strategy Form
│   │   │
│   │   └── PortfolioPage
│   │       ├── PortfolioOverview
│   │       ├── PortfolioExchanges
│   │       │   └── Recharts (Balance charts)
│   │       ├── TradeHistory
│   │       └── TradeDetailView
│   │
│   └── AppModals
│       ├── DepositModal
│       ├── WithdrawModal
│       ├── TransferModal
│       └── ExchangeSelectionModal
│
└── Toaster (Sonner notifications)
```

---

### Strategy Monitor Hierarchy

```
PortfolioPage
└── Click "Monitor Strategy" button
    ↓
StrategyMonitorPage
├── Header
│   ├── Back button → PortfolioPage
│   ├── Strategy name
│   └── Time range selector (1h, 4h, 24h, 7d)
│
├── Key Metrics Grid (8 cards)
│   ├── Total PnL
│   ├── Volume
│   ├── Position
│   ├── Avg Spread
│   ├── Fill Rate
│   ├── Imbalance
│   ├── Max Drawdown
│   └── Sharpe Ratio
│
├── Charts Column (Left, 2/3 width)
│   ├── PnL Over Time (LineChart)
│   ├── Position & Exposure (ComposedChart)
│   ├── Volume & Activity (ComposedChart)
│   ├── Order Book Imbalance (ComposedChart)
│   └── Spread & Fill Rate (ComposedChart)
│
└── Details Column (Right, 1/3 width)
    ├── Active Positions Table
    ├── Exchange Coverage
    └── Risk Metrics
```

---

## File Structure

```
/
├── main.tsx                 - Entry point
├── App.tsx                  - Root component
├── index.html               - HTML template
├── vite.config.ts           - Vite configuration
├── tsconfig.json            - TypeScript config
├── package.json             - Dependencies
├── postcss.config.js        - PostCSS config
│
├── components/
│   ├── AppRouter/
│   │   ├── AppRouter.tsx    - Custom routing
│   │   └── index.ts
│   │
│   ├── Navigation/
│   │   ├── Navigation.tsx   - Top nav bar
│   │   └── index.ts
│   │
│   ├── AppModals/
│   │   ├── AppModals.tsx    - Modal manager
│   │   └── index.ts
│   │
│   ├── PortfolioPage/
│   │   ├── PortfolioPage.tsx
│   │   └── index.ts
│   │
│   ├── PortfolioExchanges/
│   │   ├── PortfolioExchanges.tsx
│   │   └── index.ts
│   │
│   ├── StrategyMonitorPage/
│   │   ├── StrategyMonitorPage.tsx
│   │   └── index.ts
│   │
│   ├── MarketMakerPage/
│   │   ├── MarketMakerPage.tsx
│   │   └── index.ts
│   │
│   ├── ExplorePage.tsx
│   ├── FundingRateArbPage.tsx
│   ├── PortfolioOverview.tsx
│   ├── TradeHistory.tsx
│   ├── TradeDetailView.tsx
│   │
│   ├── DepositModal/
│   ├── WithdrawModal/
│   ├── TransferModal/
│   ├── ExchangeSelectionModal/
│   ├── LoginModal/
│   │
│   ├── ExchangePairSelector/
│   ├── MultiOrderConfirmation/
│   ├── CustomConnectButton/
│   ├── ExchangeLogos/
│   │
│   ├── common/
│   │   ├── ErrorBoundary.tsx
│   │   ├── ErrorMessage.tsx
│   │   └── LoadingSkeleton.tsx
│   │
│   └── ui/                  - shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── chart.tsx        - Recharts wrapper
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── table.tsx
│       └── ... (30+ components)
│
├── stores/
│   ├── appStore.ts          - Core app state (Zustand)
│   ├── authStore.ts         - Auth state (Zustand)
│   └── themeStore.ts        - Theme state (Zustand)
│
├── hooks/
│   ├── index.ts             - Barrel export
│   ├── useAuth.ts           - Auth logic
│   ├── useModals.ts         - Modal management
│   ├── useNavigation.ts     - Custom routing
│   ├── useOnboarding.ts     - Onboarding flow
│   ├── useOrderManagement.ts - Order creation
│   ├── useTradeSelection.ts - Trade pre-selection
│   ├── useFundingRates.ts   - Funding rate data
│   ├── useOrders.ts         - Order data
│   ├── usePortfolio.ts      - Portfolio data
│   └── useSessionRestore.ts - Session restoration
│
├── services/
│   ├── api/
│   │   ├── client.ts        - Main Axios instance
│   │   ├── exchanges.ts     - Exchange endpoints
│   │   ├── funding.ts       - Funding rate endpoints
│   │   ├── orders.ts        - Order endpoints
│   │   └── portfolio.ts     - Portfolio endpoints
│   │
│   └── websocket.ts         - WebSocket service
│
├── lib/
│   ├── authApi.ts           - Auth API service (SIWE)
│   └── siweAuthAdapter.ts   - SIWE adapter
│
├── config/
│   └── wagmi.ts             - Wagmi/Web3 configuration
│
├── types/
│   └── index.ts             - TypeScript type definitions
│
├── constants/
│   ├── app.ts               - App constants
│   └── storage.ts           - localStorage keys
│
├── utils/
│   ├── cn.ts                - Tailwind class merger
│   ├── logger.ts            - Logging utility
│   └── theme-helper.tsx     - Theme utilities
│
├── styles/
│   └── globals.css          - Global styles + Tailwind
│
└── docs/                    - Documentation
    ├── AUTHENTICATION.md
    ├── SIWE_AUTHENTICATION.md
    ├── BACKEND_INTEGRATION_SUMMARY.md
    └── ... (15+ docs)
```

---

## Design System

### Typography Scale

```css
/* Based on Inter font family */
Font Sizes (Using 8pt grid):
- text-[9px]   - Overline, captions
- text-[11px]  - Labels, small text (text-label class)
- text-[13px]  - Body text (text-body class)
- text-[15px]  - Headings, buttons (text-button class)
- text-[20px]  - Large headings
- text-[24px]  - Page titles
```

### Color Palette

#### Light Theme
```css
Background:
  Primary:   #F7F5EF  (warm off-white)
  Secondary: #FAFAF8  (lighter warm)
  Surface:   #FFFFFF  (pure white)
  Subtle:    #F1EEE6  (muted warm)

Text:
  Primary:   #1C1C1C  (near black)
  Secondary: #6B6B6B  (medium gray)
  Tertiary:  #9A9A9A  (light gray)

Borders:
  Default:   rgba(0,0,0,0.08)
  Secondary: rgba(0,0,0,0.06)

Accents:
  Positive:  #1FBF75  (green)
  Negative:  #E24A4A  (red)
  Primary:   #C9A36A  (golden brass)
```

#### Dark Theme
```css
Background:
  Primary:   #0a0a0a  (near black)
  Secondary: #151515  (dark gray)
  Surface:   #1a1a1a  (darker gray)
  Subtle:    #2a2a2a  (medium dark)

Text:
  Primary:   #FFFFFF  (white)
  Secondary: #9CA3AF  (gray-400)
  Tertiary:  #6B7280  (gray-500)

Borders:
  Default:   #2a2a2a
  Secondary: #333333

Accents:
  Positive:  #22c55e  (green-500)
  Negative:  #ef4444  (red-500)
  Primary:   #C9A36A  (golden brass, same)
```

### Spacing System (8pt Grid)

```css
Base unit: 8px

Spacing scale:
  0.5  → 4px   (0.5 × 8)
  1    → 8px   (1 × 8)
  1.5  → 12px  (1.5 × 8)
  2    → 16px  (2 × 8)
  3    → 24px  (3 × 8)
  4    → 32px  (4 × 8)
  6    → 48px  (6 × 8)
  8    → 64px  (8 × 8)
```

### Component Sizing

```css
Button heights:
  Small:  28px (h-7)
  Normal: 32px (h-8)
  Large:  40px (h-10)

Input heights:
  Default: 32px (h-8)
  Large:   40px (h-10)

Border radius:
  Default: 2px (rounded-sm)
  Medium:  4px (rounded)
  Large:   6px (rounded-md)
```

### Tailwind Configuration

**Version**: Tailwind CSS v4.0

**Key Features**:
- No `tailwind.config.js` needed (v4 uses CSS-based config)
- Preflight styles enabled
- Custom theme tokens in `/styles/globals.css`

**CSS Variables** (in globals.css):
```css
@import "tailwindcss";

:root {
  /* Custom fonts */
  --font-sans: "Inter", system-ui, sans-serif;
  
  /* Custom colors accessible via arbitrary values */
  --color-brass: #C9A36A;
  --color-success: #1FBF75;
  --color-error: #E24A4A;
}

/* Base text styles */
.text-label { font-size: 11px; }
.text-body { font-size: 13px; }
.text-button { font-size: 15px; }
```

---

## Key Features

### 1. Onboarding Flow

**Step 1: Deposit**
- User connects wallet
- Deposits USDC from HyperEVM
- `completeDeposit(amount)` updates appStore
- Sets `hasDeposited = true`

**Step 2: Exchange Selection**
- User selects exchanges (multi-select)
- Funds allocated equally across selections
- `setupExchanges(exchanges)` updates appStore
- Sets `hasBitfrostAccount = true`
- Moves vault balance to exchange allocations

**Completion**:
- User can now access all features
- Portfolio page shows balances
- Can execute trades on selected exchanges

---

### 2. Funding Rate Arbitrage Workflow

**Discovery (Explore Page)**:
1. View funding rates across all exchanges
2. Click first cell (e.g., BTC on Hyperliquid: +0.05%)
3. Cell highlights in blue
4. Click second cell (e.g., BTC on Paradex: -0.03%)
5. System calculates opportunity:
   - Spread: 0.08% (8 bps)
   - Long on Paradex (negative rate, receive funding)
   - Short on Hyperliquid (positive rate, receive funding)

**Execution (Trade Page)**:
1. Pre-filled with selected exchanges and tokens
2. Enter quantity
3. Choose order type (Market/Limit/TWAP)
4. Review estimated profit
5. Submit order
6. Order appears in Portfolio

**Monitoring (Portfolio Page)**:
1. View active orders
2. Track PnL
3. Manage positions

---

### 3. Portfolio Management

**Features**:
- Total equity with 24h change
- Unrealized PnL across all exchanges
- Directional bias (net long/short)
- Exchange-by-exchange breakdown
- Balance charts (Recharts)
- Quick actions (Deposit, Withdraw, Transfer)

**Data Refresh**:
- Auto-refresh every 30 seconds (configurable)
- Manual refresh button
- Loading states with skeletons

---

### 4. Strategy Monitoring

**Access**:
- From Portfolio page
- Click "Monitor Strategy" on any active strategy

**Analytics**:
- Time-series PnL with realized/unrealized breakdown
- Position tracking (long/short exposure)
- Volume analysis (cumulative + incremental)
- Order book metrics (bid/ask imbalance)
- Execution quality (spread, fill rate)
- Risk metrics (Sharpe ratio, max drawdown)

**Visualizations**:
- 5 Recharts components
- Theme-aware colors
- Interactive tooltips
- Responsive design

---

### 5. Exchange Integration

**Supported Exchanges**:
```typescript
const SUPPORTED_EXCHANGES = [
  'hyperliquid',
  'paradex',
  'aster',
  'binance',
  'bybit',
  'okx',
];
```

**User Flow**:
1. User selects exchanges during onboarding
2. Only selected exchanges are clickable throughout app
3. Non-selected exchanges remain visible but non-interactive
4. Exchange logos displayed via `ExchangeLogos` component

**State Management**:
- `selectedExchanges` in appStore
- Passed as `enabledExchanges` prop to pages
- Conditional rendering/interaction based on selection

---

### 6. Real-Time Updates

**WebSocket Integration**:
- Price updates
- Funding rate updates
- Order status updates
- Balance updates

**Polling Fallback**:
- If WebSocket unavailable
- Configurable intervals per data type

---

### 7. Error Handling

**Levels**:
1. **Component-Level**: ErrorBoundary wraps pages
2. **API-Level**: Axios interceptors handle HTTP errors
3. **Network-Level**: Graceful degradation on backend unavailability
4. **User-Facing**: Toast notifications (Sonner)

**Error Types**:
```typescript
- Network errors → "Backend unavailable, using demo mode"
- Auth errors (401) → Redirect to login
- Validation errors → Inline form errors
- Server errors (5xx) → "Something went wrong" toast
```

---

## Configuration Files

### `vite.config.ts`
```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['recharts'],  // Pre-optimize recharts
  },
  build: {
    commonjsOptions: {
      include: [/recharts/, /node_modules/],
      transformMixedEsModules: true,  // Handle recharts ESM/CJS mix
    },
  },
});
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### `package.json` (Key Dependencies)
```json
{
  "dependencies": {
    "@rainbow-me/rainbowkit": "2.2.4",
    "@tanstack/react-query": "^5.0.0",
    "axios": "^1.6.0",
    "lucide-react": "^0.487.0",
    "react": "^18.3.0",
    "react-hook-form": "7.55.0",
    "recharts": "^2.12.0",
    "sonner": "2.0.3",
    "viem": "^2.7.0",
    "wagmi": "2.15.1",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "tailwindcss": "^4.0.0",
    "typescript": "~5.4.0",
    "vite": "^5.0.0"
  }
}
```

---

## Environment Variables

Create a `.env` file in the project root:

```bash
# Network Configuration (testnet or mainnet)
VITE_NETWORK=testnet

# WalletConnect Project ID
# Get from: https://cloud.walletconnect.com/
VITE_WALLETCONNECT_PROJECT_ID=your-project-id-here

# Backend Authentication (optional)
# Set to 'false' to disable backend auth
VITE_ENABLE_BACKEND_AUTH=true
```

**Note**: Backend URL is hardcoded and cannot be changed:
- Testnet: `http://prime.testnet.bitfrost.ai:9093`
- Mainnet: `http://prime.mainnet.bitfrost.ai:9093`

---

## Development Workflow

### Running the App

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run type-check

# Lint
npm run lint
```

### Hot Module Replacement

Vite provides instant HMR for:
- React components
- CSS/Tailwind changes
- Store updates (Zustand)
- Hook changes

### Debugging

**Browser DevTools**:
- Zustand DevTools Extension (Chrome/Firefox)
- React Developer Tools
- Network tab for API calls

**Console Logging**:
- `logger.info()` - General logs
- `logger.apiRequest()` - API requests
- `logger.apiResponse()` - API responses
- `logger.error()` - Errors

**Example**:
```typescript
import { logger } from './utils/logger';

logger.info('User navigated to portfolio');
logger.apiRequest('GET', '/portfolio/summary', {});
logger.error('Failed to load data', error);
```

---

## Testing Strategy

### Unit Tests (Future)
- Test individual hooks (usePortfolio, useFundingRates)
- Test store actions (appStore, authStore)
- Test utility functions (cn, logger)

### Integration Tests (Future)
- Test complete user flows (onboarding, trade execution)
- Test API service layer with mocked responses
- Test component interactions

### E2E Tests (Future)
- Full application flows with Playwright/Cypress
- Wallet connection simulation
- Order execution flows

---

## Performance Optimizations

### Code Splitting
- Dynamic imports for heavy components (future)
- Recharts in separate chunk

### Memoization
```typescript
// In StrategyMonitorPage
const chartData = useMemo(() => generateTimeSeriesData(), [timeRange]);
const metrics = useMemo(() => calculateMetrics(chartData), [chartData]);
```

### Selective Subscriptions
```typescript
// Zustand - subscribe to specific state slices
const depositAmount = useAppStore((s) => s.depositAmount);
// Only re-renders when depositAmount changes, not entire store
```

### Image Optimization
- SVG for logos (scalable, small size)
- Lazy loading for images (future)

---

## Security Considerations

### Authentication
- HTTP-only cookies (XSS protection)
- SIWE for cryptographic wallet verification
- No sensitive data in localStorage
- CORS properly configured

### API Security
- `withCredentials: true` for authenticated requests
- Request timeouts (30 seconds)
- Rate limiting handled by backend
- No API keys in frontend code

### Wallet Security
- RainbowKit handles wallet connection securely
- No private keys stored in app
- User signs messages, not transactions (SIWE)

### Data Validation
- TypeScript type checking
- React Hook Form validation
- Backend validation (server-side)

---

## Deployment

### Build Process

```bash
npm run build
```

**Output**:
- `/dist` folder with optimized bundle
- HTML, CSS, JS minified
- Source maps for debugging

### Environment-Specific Builds

**Testnet**:
```bash
VITE_NETWORK=testnet npm run build
```

**Mainnet**:
```bash
VITE_NETWORK=mainnet npm run build
```

### Hosting Recommendations

**Static Hosting**:
- Vercel (recommended)
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront

**Configuration**:
- Ensure SPA routing support (redirect all routes to `index.html`)
- Set proper CORS headers if using different domain for API
- Enable HTTPS

---

## Browser Compatibility

**Supported Browsers**:
- Chrome/Edge: v90+
- Firefox: v88+
- Safari: v14+

**Features Requiring Modern Browser**:
- ES2020 features (used in build)
- Web3 wallet extensions
- WebSocket support
- LocalStorage API

---

## Future Enhancements

### Planned Features
1. **Advanced Analytics**
   - Historical performance charts
   - Backtesting interface
   - Risk analytics dashboard

2. **Automation**
   - Auto-rebalancing strategies
   - Stop-loss/take-profit automation
   - Scheduled order execution

3. **Social Features**
   - Copy trading
   - Strategy sharing
   - Leaderboards

4. **Mobile App**
   - React Native version
   - Push notifications
   - Biometric authentication

### Technical Improvements
1. **Testing**
   - Add comprehensive unit tests
   - E2E test suite
   - Visual regression testing

2. **Performance**
   - Virtual scrolling for large tables
   - Advanced code splitting
   - Service worker for offline support

3. **Accessibility**
   - ARIA labels across all components
   - Keyboard navigation improvements
   - Screen reader optimization

---

## Troubleshooting

### Common Issues

#### 1. Wallet Connection Fails
**Symptoms**: "Failed to connect wallet" error  
**Solutions**:
- Check browser wallet extension is installed and unlocked
- Verify correct network (HyperEVM testnet/mainnet)
- Clear browser cache and try again

#### 2. Backend API Errors
**Symptoms**: "Network error" or 401/403 errors  
**Solutions**:
- Check backend is running (`api.prime.testnet.bitfrost.ai`)
- Verify CORS configuration on backend
- Check browser console for detailed error messages
- App falls back to demo mode if backend unavailable

#### 3. Charts Not Rendering
**Symptoms**: Blank chart areas in Strategy Monitor  
**Solutions**:
- Check browser console for recharts errors
- Verify data structure matches chart expectations
- Ensure parent container has defined height
- Try refreshing the page

#### 4. Build Errors
**Symptoms**: Vite build fails  
**Solutions**:
- Delete `node_modules` and `package-lock.json`, run `npm install`
- Ensure Node.js version is 18+ (`node -v`)
- Check for TypeScript errors (`npm run type-check`)

---

## Contributing Guidelines

### Code Style
- Use TypeScript for all new files
- Follow existing naming conventions
- Add JSDoc comments for functions
- Use Prettier for formatting (auto-format on save)

### Component Guidelines
1. **Functional Components**: Use function declarations, not arrow functions
2. **Hooks**: Custom hooks start with `use` prefix
3. **Props**: Define interface for all component props
4. **State**: Use Zustand for global state, useState for local
5. **Styling**: Use Tailwind classes, avoid inline styles

### Git Workflow
1. Create feature branch from `main`
2. Make changes with descriptive commits
3. Test locally (`npm run build && npm run preview`)
4. Submit pull request with clear description

---

## Support & Contact

### Documentation
- `/docs` folder - Detailed technical docs
- `README.md` - Quick start guide
- `ARCHITECTURE_DETAILED.md` - This document

### Issues
- File bug reports with:
  - Steps to reproduce
  - Expected vs actual behavior
  - Browser/OS version
  - Console errors (if any)

---

## Changelog

### Version 1.0.0 (Current)
- ✅ Wallet-only authentication with RainbowKit
- ✅ SIWE (Sign-In with Ethereum) backend integration
- ✅ Custom routing system (resolved React Router issues)
- ✅ Onboarding flow (Deposit → Exchange Selection)
- ✅ Funding rate comparison (Explore page)
- ✅ Click-to-trade workflow (Explore → Trade navigation)
- ✅ Portfolio management with charts
- ✅ Strategy monitoring with Recharts analytics
- ✅ Light/dark theme with persistence
- ✅ Professional institutional design system
- ✅ Exchange enablement system (selective interaction)
- ✅ Deposit/Withdraw/Transfer modals
- ✅ HTTP-only cookie authentication
- ✅ Graceful backend degradation

---

## Glossary

**Arbitrage**: Exploiting price/rate differences between markets for profit

**Funding Rate**: Periodic payment between long/short traders in perpetual futures

**SIWE**: Sign-In with Ethereum - cryptographic wallet authentication standard

**HyperEVM**: Ethereum-compatible blockchain network (Chain ID 998 testnet, 999 mainnet)

**USDC**: USD Coin - stablecoin cryptocurrency

**Perpetual Contract**: Derivative with no expiration date, settled via funding rates

**Zustand**: Lightweight state management library for React

**RainbowKit**: Wallet connection library with multi-wallet support

**Wagmi**: React hooks library for Ethereum interactions

**Viem**: TypeScript library for Ethereum, alternative to ethers.js

---

## License

[Your License Here]

---

## Appendix: API Endpoints Reference

### Authentication
```
GET  /api/v1/auth/nonce              - Get nonce for SIWE
POST /api/v1/auth/login              - Login with signed message
GET  /api/v1/auth/me                 - Get current session
POST /api/v1/auth/logout             - Logout and clear session
GET  /api/v1/account                 - Get user account data
```

### Portfolio
```
GET  /api/v1/portfolio/summary       - Portfolio overview
GET  /api/v1/portfolio/exchanges     - Exchange balances
GET  /api/v1/portfolio/positions     - Active positions
```

### Funding Rates
```
GET  /api/v1/funding-rates           - Current funding rates
GET  /api/v1/funding-rates/history   - Historical funding rates
```

### Orders
```
POST /api/v1/orders                  - Create order
GET  /api/v1/orders                  - Get orders
GET  /api/v1/orders/:id              - Get order by ID
POST /api/v1/orders/:id/cancel       - Cancel order
```

### Exchanges
```
GET  /api/v1/exchanges               - Get available exchanges
POST /api/v1/exchanges/connect       - Connect exchange
POST /api/v1/exchanges/disconnect    - Disconnect exchange
```

---

**End of Architecture Documentation**
