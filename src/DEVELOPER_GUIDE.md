# Developer Integration Guide

## 🎯 Quick Start

Welcome! This guide will help you integrate the backend APIs into this frontend application.

### Prerequisites
- Node.js 18+
- Backend API running and accessible
- Wallet (MetaMask) for testing

### Installation
```bash
npm install
```

### Environment Setup
Create a `.env.local` file in the root directory:

```env
# Backend API
VITE_API_BASE_URL=https://api.bitfrost.com

# WebSocket for real-time updates
VITE_WS_URL=wss://ws.bitfrost.com

# Wallet Connect (get from https://cloud.walletconnect.com/)
VITE_WALLET_CONNECT_PROJECT_ID=your_project_id_here

# Blockchain
VITE_CHAIN_ID=1
VITE_NETWORK_NAME=HyperEVM

# Environment
VITE_ENVIRONMENT=development
```

### Run Development Server
```bash
npm run dev
```

---

## 📁 Project Structure

```
/src
├── App.tsx                          # Main app component with global state
├── types/
│   └── index.ts                     # ✅ TypeScript types for ALL data structures
├── services/
│   └── api/
│       ├── client.ts                # ✅ Axios instance with auth & interceptors
│       ├── portfolio.ts             # ✅ Portfolio API calls (EXAMPLE)
│       ├── funding.ts               # ⚠️ TODO: Funding rate API calls
│       ├── orders.ts                # ⚠️ TODO: Order management API calls
│       └── wallet.ts                # ⚠️ TODO: Wallet/transaction API calls
├── hooks/
│   ├── usePortfolio.ts              # ✅ Portfolio data hook (EXAMPLE)
│   ├── useFundingRates.ts           # ⚠️ TODO: Funding rates hook
│   ├── useOrders.ts                 # ⚠️ TODO: Orders hook
│   └── useWallet.ts                 # ⚠️ TODO: Wallet hook
├── components/
│   ├── PortfolioPage.tsx            # Portfolio dashboard
│   ├── ExplorePage.tsx              # Funding rate explorer
│   ├── FundingRateArbPage.tsx       # Order creation page
│   └── ...other components
└── contexts/
    └── ThemeContext.tsx             # Theme system (already working)
```

---

## 🔌 API Integration Pattern

### Step 1: Define Types (Already Done ✅)
See `/types/index.ts` for all TypeScript interfaces.

### Step 2: Create API Service
Create a file in `/services/api/` for each domain:

```typescript
// /services/api/funding.ts
import { get } from './client';
import type { FundingRate } from '../../types';

export async function getFundingRates(timeframe: string): Promise<FundingRate[]> {
  return get<FundingRate[]>(`/api/v1/funding/rates`, {
    params: { timeframe }
  });
}
```

### Step 3: Create Custom Hook
Create a hook in `/hooks/` to manage data fetching:

```typescript
// /hooks/useFundingRates.ts
import { useState, useEffect } from 'react';
import { getFundingRates } from '../services/api/funding';
import type { FundingRate } from '../types';

export function useFundingRates(timeframe: string) {
  const [data, setData] = useState<FundingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true);
        const rates = await getFundingRates(timeframe);
        setData(rates);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [timeframe]);

  return { data, loading, error };
}
```

### Step 4: Use in Component
Replace mock data with real data:

```typescript
// Before (with mock data):
const MOCK_FUNDING_DATA = [...];

// After (with API):
import { useFundingRates } from '../hooks/useFundingRates';

export function ExplorePage() {
  const [timeframe, setTimeframe] = useState('Day');
  const { data, loading, error } = useFundingRates(timeframe);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage error={error} />;

  return (
    // ... use `data` instead of MOCK_FUNDING_DATA
  );
}
```

---

## 📋 Integration Checklist

### Phase 1: Core Infrastructure (Week 1)

#### API Services
- [x] API client setup (`/services/api/client.ts`)
- [x] Portfolio API (`/services/api/portfolio.ts`)
- [ ] Funding rates API (`/services/api/funding.ts`)
- [ ] Orders API (`/services/api/orders.ts`)
- [ ] Wallet/transactions API (`/services/api/wallet.ts`)
- [ ] Exchanges API (`/services/api/exchanges.ts`)

#### Data Hooks
- [x] Portfolio hook (`/hooks/usePortfolio.ts`)
- [ ] Funding rates hook (`/hooks/useFundingRates.ts`)
- [ ] Orders hook (`/hooks/useOrders.ts`)
- [ ] Wallet hook (`/hooks/useWallet.ts`)
- [ ] Trade history hook (`/hooks/useTradeHistory.ts`)

#### UI Components
- [ ] Loading skeleton component
- [ ] Error message component
- [ ] Empty state component
- [ ] Retry button component

### Phase 2: Page Integration (Week 2)

#### Portfolio Page
- [ ] Replace hardcoded stats with API data
- [ ] Real-time balance updates
- [ ] Exchange balances from API
- [ ] Trade history from API
- [ ] Auto-refresh every 30 seconds

#### Explore Page
- [ ] Replace `MOCK_FUNDING_DATA` with API
- [ ] Real-time funding rate updates (WebSocket)
- [ ] Search functionality with API
- [ ] Watchlist save/load from backend

#### Funding Arb Page
- [ ] Real-time funding rates
- [ ] Order creation API integration
- [ ] Order status polling/WebSocket
- [ ] Available pairs from API

### Phase 3: Wallet & Auth (Week 2)

#### Wallet Connection
- [ ] MetaMask integration
- [ ] WalletConnect integration
- [ ] Wallet state persistence
- [ ] Disconnect functionality

#### Authentication
- [ ] Sign message for auth
- [ ] JWT token management
- [ ] Token refresh logic
- [ ] Protected routes

#### Deposits & Withdrawals
- [ ] Deposit transaction submission
- [ ] Transaction status polling
- [ ] Withdrawal flow
- [ ] Transaction history

### Phase 4: Real-time Updates (Week 3)

#### WebSocket Integration
- [ ] WebSocket client setup
- [ ] Price updates subscription
- [ ] Funding rate updates
- [ ] Order status updates
- [ ] Balance updates

#### Optimizations
- [ ] Response caching
- [ ] Request deduplication
- [ ] Optimistic UI updates
- [ ] Error retry logic

---

## 🚀 Migration Examples

### Example 1: Portfolio Stats

**Current (Mock Data):**
```typescript
// PortfolioOverview.tsx
<div className="text-[16px] font-medium mb-1.5">
  126.96 <span className="text-label">USD</span>
</div>
```

**After API Integration:**
```typescript
import { usePortfolio } from '../hooks/usePortfolio';

export function PortfolioOverview() {
  const { summary, loading, error } = usePortfolio();

  if (loading) return <PortfolioSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  if (!summary) return <EmptyState />;

  return (
    <div className="text-[16px] font-medium mb-1.5">
      {summary.totalEquity.toFixed(2)} <span className="text-label">{summary.currency}</span>
    </div>
  );
}
```

### Example 2: Funding Rates Table

**Current (Mock Data):**
```typescript
// ExplorePage.tsx
const MOCK_FUNDING_DATA = [
  { token: 'ZETA', binance: -33.101, ... },
  // ...
];

{MOCK_FUNDING_DATA.map(row => ...)}
```

**After API Integration:**
```typescript
import { useFundingRates } from '../hooks/useFundingRates';

export function ExplorePage() {
  const [timeframe, setTimeframe] = useState('Day');
  const { data: fundingData, loading, error } = useFundingRates(timeframe);

  if (loading) return <TableSkeleton />;
  if (error) return <ErrorMessage error={error} retry={() => window.location.reload()} />;

  return (
    <tbody>
      {fundingData.map(row => (
        <tr key={row.token}>
          <td>{row.token}</td>
          <td>{row.exchanges.binance?.rate ?? '-'}</td>
          {/* ... */}
        </tr>
      ))}
    </tbody>
  );
}
```

### Example 3: Order Creation

**Current (Local State):**
```typescript
const handleCreateOrder = (orderData) => {
  const newOrder = {
    ...orderData,
    id: `order-${Date.now()}`,
  };
  setActiveOrder(newOrder);
};
```

**After API Integration:**
```typescript
import { createOrder } from '../services/api/orders';
import { toast } from 'sonner';

const handleCreateOrder = async (orderData) => {
  try {
    setSubmitting(true);
    const order = await createOrder(orderData);
    
    toast.success('Order created successfully!');
    setActiveOrder(order);
    
    // Poll for order status
    startOrderPolling(order.id);
  } catch (error) {
    toast.error(`Failed to create order: ${error.message}`);
  } finally {
    setSubmitting(false);
  }
};
```

---

## 🔐 Authentication Flow

### 1. Wallet Connection
```typescript
// hooks/useWallet.ts
import { ethers } from 'ethers';

export function useWallet() {
  const connect = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    
    // Sign message for authentication
    const message = `Sign this message to authenticate with Bitfrost\nNonce: ${Date.now()}`;
    const signature = await signer.signMessage(message);
    
    // Send to backend for verification
    const { token } = await authenticateWallet(address, signature, message);
    
    // Store token
    setAuthToken(token);
    setWalletAddress(address);
    
    return { address, token };
  };
  
  return { connect };
}
```

### 2. API Calls with Auth
The API client automatically adds the auth token to all requests:
```typescript
// services/api/client.ts (already implemented)
config.headers.Authorization = `Bearer ${token}`;
```

---

## 🐛 Error Handling

### API Errors
All API calls should handle errors gracefully:

```typescript
try {
  const data = await getPortfolioSummary();
  setData(data);
} catch (error) {
  if (error.response?.status === 401) {
    // Unauthorized - redirect to login
    handleLogout();
  } else if (error.response?.status === 429) {
    // Rate limited - show message
    toast.error('Too many requests. Please wait a moment.');
  } else {
    // Generic error
    toast.error('Failed to load data. Please try again.');
  }
  setError(error);
}
```

### Display Errors to Users
```typescript
{error && (
  <div className="error-message">
    <p>{error.message}</p>
    <button onClick={refetch}>Retry</button>
  </div>
)}
```

---

## 🎨 Loading States

### Skeleton Component Example
```typescript
export function TableSkeleton() {
  return (
    <div className="animate-pulse">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="h-10 bg-gray-200 mb-2 rounded" />
      ))}
    </div>
  );
}
```

### Usage
```typescript
{loading ? (
  <TableSkeleton />
) : (
  <Table data={data} />
)}
```

---

## 🔄 Real-time Updates (WebSocket)

### WebSocket Client
```typescript
// services/websocket.ts
export class WebSocketClient {
  private ws: WebSocket | null = null;
  
  connect(url: string) {
    this.ws = new WebSocket(url);
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
  }
  
  subscribe(channel: string, callback: (data: any) => void) {
    // Subscribe to specific data channel
  }
}
```

### Usage in Hook
```typescript
useEffect(() => {
  const ws = new WebSocketClient();
  ws.connect(WS_URL);
  
  ws.subscribe('funding-rates', (update) => {
    setFundingRates(prev => updateRates(prev, update));
  });
  
  return () => ws.disconnect();
}, []);
```

---

## 📝 Code Comments Best Practices

### Component Documentation
```typescript
/**
 * PortfolioPage Component
 * 
 * Main portfolio dashboard showing user's trading account overview.
 * Displays total equity, exchange balances, and trade history.
 * 
 * Features:
 * - Real-time balance updates via WebSocket
 * - Auto-refresh every 30 seconds
 * - Manual refresh via button
 * 
 * API Dependencies:
 * - GET /api/v1/portfolio/summary
 * - GET /api/v1/portfolio/exchanges
 * - GET /api/v1/trades/history
 * - WS /funding-rates (real-time updates)
 * 
 * @param hasAccount - Whether user completed onboarding
 * @param selectedExchanges - Array of connected exchange IDs
 */
export function PortfolioPage({ hasAccount, selectedExchanges }: Props) {
  // ...
}
```

### Complex Logic
```typescript
// Calculate funding rate arbitrage opportunity
// Formula: (sell_rate - buy_rate) * position_size * 8 hours
// 8 hours = typical funding interval on perpetual exchanges
const arbProfit = (sellRate - buyRate) * positionSize * 8;
```

---

## 🧪 Testing

### Test API Calls
```typescript
// __tests__/services/portfolio.test.ts
import { getPortfolioSummary } from '../services/api/portfolio';

describe('Portfolio API', () => {
  it('should fetch portfolio summary', async () => {
    const summary = await getPortfolioSummary();
    expect(summary).toHaveProperty('totalEquity');
  });
});
```

---

## 📚 Additional Resources

- **API Documentation**: [Link to your API docs]
- **Figma Design**: [Link to Figma file]
- **Project Spec**: [Link to requirements doc]

---

## 🆘 Need Help?

### Common Issues

**Q: API calls returning 401 Unauthorized**
A: Make sure wallet is connected and auth token is valid. Check localStorage for `auth_token`.

**Q: CORS errors in development**
A: Add `http://localhost:5173` to your backend CORS whitelist.

**Q: Data not updating in real-time**
A: Check WebSocket connection status and ensure subscriptions are active.

### Contact
- Slack: #frontend-dev
- Email: dev@bitfrost.com

---

## ✅ Definition of Done

Before marking a page as "complete":

1. [ ] All mock data replaced with API calls
2. [ ] Loading states implemented
3. [ ] Error handling implemented
4. [ ] Success/error toast notifications added
5. [ ] TypeScript types defined
6. [ ] Code comments added
7. [ ] Manual testing completed
8. [ ] Edge cases handled (empty data, errors, etc.)

---

Good luck! 🚀
