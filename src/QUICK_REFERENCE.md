# 🚀 Quick Reference - API Integration

## 📋 Common Tasks

### 1. Fetch Portfolio Data
```tsx
import { usePortfolioContext } from '../contexts/PortfolioContext';

const { summary, exchanges, loading, error, refetch } = usePortfolioContext();

// Access data
console.log(summary.totalEquity);        // 126.96
console.log(summary.unrealizedPnL);      // -9.73
console.log(exchanges[0].balance);       // 50.00
```

### 2. Connect Wallet
```tsx
import { useWalletContext } from '../contexts/WalletContext';

const { connect, disconnect, address, isConnecting } = useWalletContext();

// Connect
await connect();

// Check address
console.log(address); // "0x742d35Cc..."

// Disconnect
await disconnect();
```

### 3. Fetch Funding Rates
```tsx
import { useFundingRates } from '../hooks/useFundingRates';

const { data, loading, error, refetch } = useFundingRates('day', true);

// Access data (real-time updates via WebSocket)
data.forEach(rate => {
  console.log(`${rate.token}: ${rate.exchanges.binance?.rate}%`);
});
```

### 4. Create Order
```tsx
import { useOrders } from '../hooks/useOrders';
import { toast } from 'sonner';

const { create, activeOrders } = useOrders();

const handleCreate = async () => {
  try {
    const order = await create({
      type: 'multi',
      buyExchange: 'hyperliquid',
      buyPair: 'BTC-PERP-USDC',
      buyQuantity: 0.5,
      sellExchange: 'binance',
      sellPair: 'BTCUSDT',
      sellQuantity: 0.5
    });
    
    toast.success(`Order created: ${order.id}`);
  } catch (error) {
    toast.error(`Failed: ${error.message}`);
  }
};
```

### 5. Handle Deposits
```tsx
import { initiateDeposit } from '../services/api/wallet';
import { toast } from 'sonner';

const handleDeposit = async (amount: number) => {
  try {
    const deposit = await initiateDeposit({
      amount,
      asset: 'USDC',
      network: 'HyperEVM'
    });
    
    toast.success(`Deposit address: ${deposit.depositAddress}`);
    // User sends USDC to this address
  } catch (error) {
    toast.error(`Deposit failed: ${error.message}`);
  }
};
```

---

## 🧩 Component Patterns

### Loading State
```tsx
function MyComponent() {
  const { data, loading, error } = useMyData();
  
  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return <EmptyState />;
  
  return <div>{/* Render data */}</div>;
}
```

### Error Handling with Retry
```tsx
<ErrorMessage 
  error={error} 
  title="Failed to load data"
  onRetry={refetch}
/>
```

### Loading Skeleton
```tsx
import { FundingRateTableSkeleton } from '../components/common/LoadingSkeleton';

{loading && <FundingRateTableSkeleton />}
```

---

## 📡 API Endpoints Reference

### Portfolio
```
GET  /api/v1/portfolio/summary      → PortfolioSummary
GET  /api/v1/portfolio/exchanges    → ExchangeBalance[]
GET  /api/v1/portfolio/positions    → Position[]
GET  /api/v1/portfolio/pnl          → PnLData
```

### Funding Rates
```
GET  /api/v1/funding/rates?timeframe=day → FundingRate[]
GET  /api/v1/funding/rates/:token        → FundingRate
WS   /funding_rate_update                → FundingRateUpdate
```

### Orders
```
POST /api/v1/orders                 → Order
GET  /api/v1/orders                 → PaginatedResponse<Order>
GET  /api/v1/orders/:id             → Order
PUT  /api/v1/orders/:id/cancel      → Order
WS   /order_update                  → Order status updates
```

### Wallet
```
POST /api/v1/auth/wallet            → { accessToken, refreshToken, user }
POST /api/v1/wallet/deposit         → Transaction
POST /api/v1/wallet/withdraw        → Transaction
GET  /api/v1/wallet/transactions    → Transaction[]
GET  /api/v1/wallet/balance         → Balance
```

### Exchanges
```
GET  /api/v1/exchanges              → Exchange[]
POST /api/v1/exchanges/:id/connect  → Exchange
POST /api/v1/exchanges/:id/api-keys → { success: boolean }
GET  /api/v1/exchanges/:id/pairs    → string[]
```

---

## 🔧 Environment Variables

```env
# Required
VITE_API_BASE_URL=https://api.bitfrost.com
VITE_WS_URL=wss://ws.bitfrost.com

# Optional
VITE_WALLET_CONNECT_PROJECT_ID=your_project_id
VITE_CHAIN_ID=1
VITE_ENVIRONMENT=production
```

---

## 📦 Import Cheatsheet

```tsx
// API Services
import { getPortfolioSummary } from '../services/api/portfolio';
import { getFundingRates } from '../services/api/funding';
import { createOrder, getActiveOrders } from '../services/api/orders';
import { initiateDeposit, initiateWithdrawal } from '../services/api/wallet';
import { getExchanges, connectExchange } from '../services/api/exchanges';

// Hooks
import { useWallet } from '../hooks/useWallet';
import { usePortfolio } from '../hooks/usePortfolio';
import { useFundingRates } from '../hooks/useFundingRates';
import { useOrders } from '../hooks/useOrders';

// Contexts
import { useWalletContext } from '../contexts/WalletContext';
import { usePortfolioContext } from '../contexts/PortfolioContext';
import { useTheme } from '../contexts/ThemeContext';

// Components
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { 
  LoadingSkeleton,
  TableSkeleton,
  FundingRateTableSkeleton,
  PortfolioSkeleton,
  Spinner
} from '../components/common/LoadingSkeleton';

// Types
import type {
  User,
  PortfolioSummary,
  ExchangeBalance,
  Position,
  Order,
  FundingRate,
  Transaction
} from '../types';

// WebSocket
import { wsClient } from '../services/websocket';
```

---

## 🎯 Migration Checklist

- [ ] Set up `.env.local` with API endpoints
- [ ] Wrap App.tsx with ErrorBoundary, WalletProvider, PortfolioProvider
- [ ] Replace LoginModal with real wallet connection
- [ ] Update PortfolioPage to use usePortfolioContext()
- [ ] Replace ExplorePage with ExplorePageWithAPI.tsx
- [ ] Update FundingRateArbPage to use useOrders()
- [ ] Wire up DepositModal to wallet API
- [ ] Wire up WithdrawModal to wallet API
- [ ] Test WebSocket real-time updates
- [ ] Add toast notifications with sonner

---

## 🐛 Debugging Tips

### Check Wallet Connection
```tsx
const { address, isConnected, error } = useWalletContext();
console.log('Wallet:', { address, isConnected, error });
```

### Check API Token
```tsx
const token = localStorage.getItem('auth_token');
console.log('Token:', token ? 'Set' : 'Not set');
```

### Check WebSocket
```tsx
import { wsClient } from '../services/websocket';
console.log('WS Connected:', wsClient.isConnected);
```

### Check API Response
```tsx
try {
  const data = await getPortfolioSummary();
  console.log('API Response:', data);
} catch (error) {
  console.error('API Error:', error.response?.data);
}
```

---

## 📚 Where to Look

| Task | File |
|------|------|
| Understand types | `/types/index.ts` |
| See API calls | `/services/api/*.ts` |
| Check hooks | `/hooks/*.ts` |
| Error handling | `/components/common/ErrorMessage.tsx` |
| Loading states | `/components/common/LoadingSkeleton.tsx` |
| WebSocket | `/services/websocket.ts` |
| Full example | `/components/ExplorePageWithAPI.tsx` |
| Migration guide | `/DEVELOPER_GUIDE.md` |

---

## ⚡ Quick Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Type check
npm run type-check
```

---

## 💡 Pro Tips

1. **Always check loading and error states**
   ```tsx
   if (loading) return <LoadingSkeleton />;
   if (error) return <ErrorMessage error={error} onRetry={refetch} />;
   ```

2. **Use toast notifications for user feedback**
   ```tsx
   import { toast } from 'sonner';
   toast.success('Order created!');
   toast.error('Failed to create order');
   ```

3. **WebSocket updates are automatic**
   - Just use hooks with `enableRealtime: true`
   - Updates trigger re-renders automatically

4. **Types are your friend**
   - Import types from `/types/index.ts`
   - TypeScript will catch errors before runtime

5. **Check the examples**
   - `ExplorePageWithAPI.tsx` has everything wired up
   - Copy patterns from there

---

**Need help? Read `/DEVELOPER_GUIDE.md` for detailed examples!**
