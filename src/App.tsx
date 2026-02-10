/**
 * Bitfrost - Funding Rate Arbitrage Application
 *
 * Main application component with mock wallet integration and Zustand state management.
 * Updated: Navigation and Portfolio fixes
 */

import { FC, useEffect } from "react";
import { Toaster } from "./components/ui/sonner";
import { MockWalletProvider, useMockWallet } from "./contexts/MockWalletContext";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Stores
import { useAppStore } from "./stores/appStore";
import { useThemeStore } from "./stores/themeStore";
import { useMarketDataStore } from "./stores/marketDataStore";

// Components
import Navigation from "./components/Navigation";
import AppRouter from "./components/AppRouter";
import AppModals from "./components/AppModals";

// Hooks
import { useNavigation } from "./hooks/useNavigation";
import { useModals } from "./hooks/useModals";
import { useOnboarding } from "./hooks/useOnboarding";
import { useOrderManagement } from "./hooks/useOrderManagement";
import { useTradeSelection } from "./hooks/useTradeSelection";
import { usePnlTracking } from "./hooks/usePnlTracking";
import { useFundingRateStorage } from "./hooks/useFundingRateStorage";

// Types & Config
import type { CreateOrderRequest } from "./types";
import { logger } from "./utils/logger";

// ============================================================================
// APP CONTENT COMPONENT
// ============================================================================

const AppContent: FC = () => {
  // Zustand Stores
  const theme = useThemeStore((s) => s.theme);
  const { setExchanges, refreshAllAssets } = useMarketDataStore();
  const hasDeposited = useAppStore((s) => s.hasDeposited);
  const hasBitfrostAccount = useAppStore(
    (s) => s.hasBitfrostAccount,
  );
  const depositAmount = useAppStore((s) => s.depositAmount);
  const selectedExchanges = useAppStore(
    (s) => s.selectedExchanges,
  );
  const activeOrder = useAppStore((s) => s.activeOrder);
  const preselectedTrade = useAppStore(
    (s) => s.preselectedTrade,
  );
  const exchangeAllocations = useAppStore(
    (s) => s.exchangeAllocations,
  );
  const disconnectWallet = useAppStore(
    (s) => s.disconnectWallet,
  );
  const completeDeposit = useAppStore((s) => s.completeDeposit);
  const setupExchanges = useAppStore((s) => s.setupExchanges);
  const createOrder = useAppStore((s) => s.createOrder);
  const clearOrder = useAppStore((s) => s.clearOrder);
  const setPreselectedTrade = useAppStore(
    (s) => s.setPreselectedTrade,
  );
  const updateDepositAmount = useAppStore(
    (s) => s.updateDepositAmount,
  );
  const transferFunds = useAppStore((s) => s.transferFunds);

  const { isConnected, address, disconnect } = useMockWallet();

  // Custom Hooks
  const { currentPage, navigateTo } = useNavigation();
  const { modals, openModal, closeModal } = useModals();
  const {
    handleDeposit: handleCompleteDeposit,
    handleExchangeSetup: handleCompleteExchangeSetup,
  } = useOnboarding({
    openModal,
    closeModal,
  });
  const { handleCreateOrder } = useOrderManagement({
    navigateTo,
  });
  const { handleTradeSelect } = useTradeSelection({
    navigateTo,
  });
  
  // Activate PNL tracking (passive hook - records data points automatically)
  usePnlTracking();
  
  // NOTE: Market data and funding rate fetching temporarily disabled
  // Market data is initialized via the store's initial state
  // Uncomment when Loris API integration is re-enabled:
  // useMarketData();
  // useFundingRateStorage();

  // Effects
  useEffect(() => {
    if (!isConnected) {
      disconnectWallet();
    }
  }, [isConnected, disconnectWallet]);

  // Sync enabled exchanges with market data store
  useEffect(() => {
    if (selectedExchanges.length > 0) {
      const updatedExchanges = [
        { id: 'hyperliquid', name: 'Hyperliquid', enabled: selectedExchanges.includes('Hyperliquid') },
        { id: 'paradex', name: 'Paradex', enabled: selectedExchanges.includes('Paradex') },
        { id: 'aster', name: 'Aster', enabled: selectedExchanges.includes('Aster') },
        { id: 'binance', name: 'Binance', enabled: selectedExchanges.includes('Binance') },
        { id: 'bybit', name: 'Bybit', enabled: selectedExchanges.includes('Bybit') },
        { id: 'okx', name: 'OKX', enabled: selectedExchanges.includes('OKX') },
      ];
      setExchanges(updatedExchanges);
    }
  }, [selectedExchanges, setExchanges]);

  // Fetch initial market data on mount
  useEffect(() => {
    refreshAllAssets();
  }, []);

  // Handlers
  const handleDisconnect = async () => {
    try {
      disconnect();
      disconnectWallet();
      logger.info("User disconnected wallet");
    } catch (error) {
      logger.error("Error during disconnect:", error);
    }
  };

  const handleWalletConnect = async () => {
    logger.info("Wallet connected");
  };

  const handleDeposit = (amount: number) => {
    // If user has already deposited before, skip exchange selection
    if (hasDeposited) {
      // Just update the deposit amount and close the modal
      completeDeposit(amount);
      closeModal("deposit");
    } else {
      // First time deposit - go through onboarding flow with exchange selection
      handleCompleteDeposit(amount);
      closeModal("deposit");
    }
  };

  const handleExchangeSetup = (exchanges: string[]) => {
    handleCompleteExchangeSetup(exchanges);
    closeModal("exchangeSelection");
  };

  const handleOrderCreate = (order: CreateOrderRequest) => {
    handleCreateOrder(order);
  };

  const handleWithdraw = (amount: number) => {
    const newAmount = Math.max(0, depositAmount - amount);
    updateDepositAmount(newAmount);
    closeModal("withdraw");
  };

  const handleTransfer = (
    exchange: string,
    amount: number,
    direction: "toExchange" | "fromExchange",
  ) => {
    transferFunds(exchange, amount, direction);

    if (direction === "toExchange") {
      updateDepositAmount(depositAmount - amount);
    } else {
      updateDepositAmount(depositAmount + amount);
    }

    closeModal("transfer");
  };

  const handleNavigateToStrategy = (strategyId: string) => {
    // Navigate to portfolio page with strategy ID as query param
    navigateTo('portfolio', `strategyId=${strategyId}`);
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] dark:bg-[#0a0a0a]">
      <Toaster />
      <Navigation
        currentPage={currentPage}
        onNavigate={navigateTo}
        isWalletConnected={isConnected}
        onDisconnect={handleDisconnect}
        onDeposit={() => openModal("deposit")}
        onWalletConnect={handleWalletConnect}
      />

      <AppRouter
        hasDeposited={hasDeposited}
        hasAccount={hasBitfrostAccount}
        depositAmount={depositAmount}
        selectedExchanges={selectedExchanges}
        exchangeAllocations={exchangeAllocations}
        activeOrder={activeOrder}
        preselectedTrade={preselectedTrade}
        onNavigate={navigateTo}
        onCreateOrder={handleOrderCreate}
        onClearActiveOrder={clearOrder}
        onOpenDeposit={() => openModal("deposit")}
        onOpenWithdraw={() => openModal("withdraw")}
        onOpenTransfer={() => openModal("transfer")}
        onConfigureAccounts={() =>
          openModal("exchangeSelection")
        }
        onTradeSelect={handleTradeSelect}
        onNavigateToStrategy={handleNavigateToStrategy}
      />

      <AppModals
        modals={modals}
        isWalletConnected={isConnected}
        depositAmount={depositAmount}
        exchangeAllocations={exchangeAllocations}
        onDeposit={handleDeposit}
        onWithdraw={handleWithdraw}
        onTransfer={handleTransfer}
        onExchangeSetup={handleExchangeSetup}
        onCloseDeposit={() => closeModal("deposit")}
        onCloseWithdraw={() => closeModal("withdraw")}
        onCloseTransfer={() => closeModal("transfer")}
        onCloseExchangeSelection={() =>
          closeModal("exchangeSelection")
        }
      />
    </div>
  );
};

// ============================================================================
// APP COMPONENT
// ============================================================================

const App: FC = () => {
  // Log for debugging in production
  console.log('Bitfrost App initializing...');
  
  return (
    <MockWalletProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </MockWalletProvider>
  );
};

export default App;