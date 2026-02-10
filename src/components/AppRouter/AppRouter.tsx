import { useState, useEffect } from 'react';
import { PortfolioPage } from '../PortfolioPage/PortfolioPage';
import ExplorePage from '../ExplorePage';
import AggregatorPage from '../AggregatorPage';
import FundingRateArbPage from '../FundingRateArbPage';
import MarketMakerPage from '../MarketMakerPage/MarketMakerPage';
import MorePage from '../MorePage';
import { BlockchainExplorerPage } from '../BlockchainExplorerPage/BlockchainExplorerPage';
import type { CreateOrderRequest } from '../../types';

interface Order {
  id: string;
  buyAccount: string;
  buyPair: string;
  buyQuantity: string;
  sellAccount: string;
  sellPair: string;
  sellQuantity: string;
  duration: string;
  timestamp: number;
}

interface PreselectedTrade {
  buyToken: string;
  buyExchange: string;
  sellToken: string;
  sellExchange: string;
}

interface SelectedCell {
  token: string;
  exchange: string;
  rate: number;
}

interface AppRouterProps {
  hasDeposited?: boolean;
  hasAccount: boolean;
  depositAmount: number;
  selectedExchanges: string[];
  exchangeAllocations?: Record<string, number>;
  activeOrder: Order | null;
  preselectedTrade: PreselectedTrade | null;
  isWalletConnected?: boolean;
  onNavigate?: (page: string) => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenTransfer: () => void;
  onConfigureAccounts?: () => void;
  onClearActiveOrder: () => void;
  onTradeSelect: (buyData: SelectedCell, sellData: SelectedCell) => void;
  onCreateOrder: (orderRequest: CreateOrderRequest) => void;
  onWalletConnect?: () => void;
  onNavigateToStrategy?: (strategyId: string) => void;
}

export function AppRouter({
  hasAccount,
  depositAmount,
  selectedExchanges,
  activeOrder,
  preselectedTrade,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenTransfer,
  onConfigureAccounts,
  onClearActiveOrder,
  onTradeSelect,
  onCreateOrder,
  onNavigateToStrategy,
  onNavigate,
}: AppRouterProps) {
  // Track current path - updates whenever URL changes
  const [currentPath, setCurrentPath] = useState(() => 
    typeof window !== 'undefined' ? window.location.pathname : '/explore'
  );

  // Listen to ALL navigation events
  useEffect(() => {
    const updatePath = () => {
      setCurrentPath(window.location.pathname);
    };

    // Listen to browser back/forward
    window.addEventListener('popstate', updatePath);
    
    // Listen to our custom navigation event
    window.addEventListener('navigation', updatePath);
    
    // Also patch pushState and replaceState
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args);
      updatePath();
    };
    
    window.history.replaceState = function(...args) {
      originalReplaceState.apply(window.history, args);
      updatePath();
    };

    return () => {
      window.removeEventListener('popstate', updatePath);
      window.removeEventListener('navigation', updatePath);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  const renderPage = () => {
    switch (currentPath) {
      case '/blockchain-explorer':
        return <BlockchainExplorerPage />;
      case '/portfolio':
        // Check if there's a strategy ID in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const strategyId = urlParams.get('strategyId');
        
        return (
          <PortfolioPage
            hasAccount={hasAccount}
            depositAmount={depositAmount}
            selectedExchanges={selectedExchanges}
            onOpenDeposit={onOpenDeposit}
            onOpenWithdraw={onOpenWithdraw}
            onOpenTransfer={onOpenTransfer}
            onConfigureAccounts={onConfigureAccounts}
            activeOrder={activeOrder}
            onClearActiveOrder={onClearActiveOrder}
            initialStrategyId={strategyId || undefined}
          />
        );
      case '/trade':
        return (
          <FundingRateArbPage
            enabledExchanges={selectedExchanges}
            onCreateOrder={onCreateOrder}
            preselectedTrade={preselectedTrade}
            onOpenDeposit={onOpenDeposit}
            onOpenWithdraw={onOpenWithdraw}
            onOpenTransfer={onOpenTransfer}
            onNavigate={onNavigate}
          />
        );
      case '/market-maker':
        return (
          <MarketMakerPage
            enabledExchanges={selectedExchanges}
            onCreateOrder={onCreateOrder}
            onOpenDeposit={onOpenDeposit}
            onOpenWithdraw={onOpenWithdraw}
            onOpenTransfer={onOpenTransfer}
            onNavigateToStrategy={onNavigateToStrategy}
          />
        );
      case '/aggregator':
        return (
          <AggregatorPage
            enabledExchanges={selectedExchanges}
            onCreateOrder={onCreateOrder}
            onOpenDeposit={onOpenDeposit}
            onOpenWithdraw={onOpenWithdraw}
            onOpenTransfer={onOpenTransfer}
            onNavigate={onNavigate}
          />
        );
      case '/more':
        return <MorePage />;
      case '/explore':
      default:
        return (
          <ExplorePage
            enabledExchanges={selectedExchanges}
            onTradeSelect={onTradeSelect}
          />
        );
    }
  };

  return <>{renderPage()}</>;
}

export default AppRouter;