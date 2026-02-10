# Bitfrost Application Architecture

## Overview

This document describes the architecture and code organization of the Bitfrost funding rate arbitrage application. The codebase follows senior-level development patterns with proper separation of concerns, type safety, and maintainability.

## Architecture Patterns

### 1. State Management

The application uses **Context API with useReducer** for predictable state management:

- **AppContext**: Core application state (wallet connection, onboarding, orders, trades)
- **ThemeContext**: UI theme and color system
- **WalletContext**: Wallet connection state (ready for integration)
- **PortfolioContext**: Portfolio data (ready for integration)

**Why this approach?**
- Predictable state updates through reducer pattern
- Type-safe with TypeScript
- Easy to test and debug
- No external dependencies (Redux, Zustand, etc.)
- Scalable for future growth

### 2. Custom Hooks

Business logic is extracted into reusable hooks:

```typescript
// Navigation management
useNavigation()

// Modal visibility
useModals()

// Onboarding flow orchestration
useOnboarding()

// Order lifecycle management
useOrderManagement()

// Trade selection from Explore page
useTradeSelection()
```

**Benefits:**
- Separation of concerns
- Reusable across components
- Easier to test
- Cleaner component code

### 3. Component Composition

Components are organized by responsibility:

```
/App.tsx              // Root component with providers
/components/
  ├── AppRouter.tsx   // Page routing logic
  ├── AppModals.tsx   // Modal rendering
  ├── Navigation.tsx  // Top navigation bar
  ├── PortfolioPage.tsx
  ├── ExplorePage.tsx
  └── FundingRateArbPage.tsx
```

**Key principles:**
- Single Responsibility Principle
- Props drilling avoided through context
- Clean separation between container and presentational components

## Directory Structure

```
/
├── App.tsx                    # Root component
├── components/                # React components
│   ├── common/               # Shared components (ErrorBoundary, LoadingSkeleton, etc.)
│   ├── ui/                   # UI component library (shadcn/ui)
│   ├── AppRouter.tsx         # Page routing
│   ├── AppModals.tsx         # Modal management
│   └── [feature]Page.tsx     # Feature pages
├── contexts/                 # React context providers
│   ├── AppContext.tsx        # Core app state
│   ├── ThemeContext.tsx      # Theme state
│   ├── WalletContext.tsx     # Wallet state
│   ├── PortfolioContext.tsx  # Portfolio state
│   └── index.ts              # Barrel export
├── hooks/                    # Custom React hooks
│   ├── useModals.ts          # Modal management
│   ├── useNavigation.ts      # Navigation
│   ├── useOnboarding.ts      # Onboarding flow
│   ├── useOrderManagement.ts # Order operations
│   ├── useTradeSelection.ts  # Trade selection
│   └── index.ts              # Barrel export
├── services/                 # API and external services
│   ├── api/                  # API client and endpoints
│   └── websocket.ts          # WebSocket connection
├── types/                    # TypeScript type definitions
│   └── index.ts              # All app types
├── constants/                # App-wide constants
│   └── app.ts                # Configuration values
├── utils/                    # Utility functions
│   ├── cn.ts                 # Class name utility
│   └── theme-helper.tsx      # Theme utilities
└── styles/                   # Global styles
    └── globals.css           # Tailwind and global CSS
```

## Data Flow

### State Flow Pattern

```
User Action → Component → Hook → Context Action → Reducer → New State → Re-render
```

### Example: Creating an Order

1. User clicks "Submit Multi Order" in `FundingRateArbPage`
2. Component calls `onCreateOrder(orderData)`
3. `useOrderManagement` hook processes the request
4. Hook calls `actions.createOrder()` from AppContext
5. Reducer updates state immutably
6. Components re-render with new state
7. User navigates to Portfolio page

## Key Design Decisions

### 1. Why useReducer over useState?

```typescript
// ❌ Before: Multiple useState calls
const [isWalletConnected, setIsWalletConnected] = useState(false);
const [hasDeposited, setHasDeposited] = useState(false);
const [depositAmount, setDepositAmount] = useState(0);
// ... 7 more state variables

// ✅ After: Single reducer with actions
const { state, actions } = useAppContext();
actions.connectWallet();
actions.completeDeposit(1000);
```

**Benefits:**
- Related state updates happen atomically
- Predictable state transitions
- Easier to debug with dev tools
- Better for testing

### 2. Why Custom Hooks?

```typescript
// ❌ Before: Business logic in component
const handleDeposit = (amount: number) => {
  setDepositAmount(amount);
  setHasDeposited(true);
  setShowDepositModal(false);
  setShowExchangeModal(true);
};

// ✅ After: Logic in hook
const { handleDeposit } = useOnboarding({ openModal, closeModal });
```

**Benefits:**
- Components focus on rendering
- Logic is reusable
- Easier to test logic in isolation
- Better code organization

### 3. Why Barrel Exports?

```typescript
// ❌ Before: Multiple imports
import { useModals } from '../hooks/useModals';
import { useNavigation } from '../hooks/useNavigation';
import { useOnboarding } from '../hooks/useOnboarding';

// ✅ After: Single import
import { useModals, useNavigation, useOnboarding } from '../hooks';
```

**Benefits:**
- Cleaner imports
- Easier refactoring
- Better IDE autocomplete

## Type Safety

All components, hooks, and functions are fully typed with TypeScript:

### Shared Types

```typescript
// All types are defined in /types/index.ts
import type { Order, CreateOrderRequest, FundingRate } from '../types';
```

### Component Props

```typescript
interface AppRouterProps {
  currentPage: Page;
  hasAccount: boolean;
  selectedExchanges: string[];
  // ... fully typed props
}
```

### Context Values

```typescript
interface AppContextValue {
  state: AppState;
  actions: {
    connectWallet: () => void;
    createOrder: (order: Order) => void;
    // ... fully typed actions
  };
}
```

## Error Handling

### API Errors

```typescript
// Error handling in API layer
try {
  const result = await apiClient.post('/orders', orderData);
  return result;
} catch (error) {
  // Log error, show toast, etc.
  throw new AppError('ORDER_CREATION_FAILED', error);
}
```

### Component Errors

```typescript
// Error boundaries for component errors
<ErrorBoundary>
  <ExplorePage />
</ErrorBoundary>
```

## Testing Strategy

### Unit Tests

- Test hooks in isolation
- Test reducers with different actions
- Test utility functions

### Integration Tests

- Test component + hook integration
- Test full user flows (onboarding, order creation)

### E2E Tests

- Test critical paths (connect wallet → deposit → create order)

## Performance Optimizations

### 1. Memoized Callbacks

```typescript
const actions = {
  connectWallet: useCallback(() => {
    dispatch({ type: 'CONNECT_WALLET' });
  }, []),
};
```

### 2. Component Composition

Instead of conditional rendering in one large component, we split into smaller components:

```typescript
// ✅ Good: Separate components
<AppRouter currentPage={currentPage} />
<AppModals modals={modals} />

// ❌ Bad: Large conditional block
{currentPage === 'portfolio' && <div>...</div>}
{currentPage === 'explore' && <div>...</div>}
```

### 3. Lazy Loading (Future)

```typescript
// Components can be lazy loaded when needed
const ExplorePage = lazy(() => import('./components/ExplorePage'));
```

## Code Quality Standards

### 1. Documentation

- Every hook has JSDoc comments
- Complex functions have inline comments
- README files for major features

### 2. Naming Conventions

- Components: PascalCase (`AppRouter`)
- Hooks: camelCase with "use" prefix (`useModals`)
- Types: PascalCase (`AppState`)
- Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)

### 3. File Organization

- One component per file
- Related types in the same file or `/types`
- Hooks separated by concern
- Constants in dedicated files

## Future Improvements

### 1. Router Library Integration

When the app grows, consider replacing `useNavigation` with:
- React Router (for web apps)
- Wouter (lightweight alternative)

### 2. State Management Library

If state becomes more complex:
- Zustand (lightweight)
- Redux Toolkit (full-featured)

### 3. Form Handling

For complex forms, integrate:
- React Hook Form (already imported in some components)
- Zod for validation

### 4. API Layer Enhancement

- Add request/response interceptors
- Implement retry logic
- Add caching layer
- WebSocket reconnection logic

## Contributing

When adding new features:

1. **Define types first** in `/types/index.ts`
2. **Create constants** in `/constants/app.ts` if needed
3. **Build hook** if business logic is complex
4. **Add to context** if state needs to be shared
5. **Document** with JSDoc comments
6. **Test** the happy path and error cases

## Summary

This architecture provides:

✅ **Type Safety**: Full TypeScript coverage
✅ **Maintainability**: Clear separation of concerns
✅ **Testability**: Logic separated from UI
✅ **Scalability**: Easy to add features
✅ **Performance**: Optimized re-renders
✅ **Developer Experience**: Clean imports, good documentation
