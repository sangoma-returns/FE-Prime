/**
 * Application Modals
 *
 * Centralized component for rendering all application modals.
 * Separates modal rendering logic from the main app component.
 *
 * @example
 * ```tsx
 * <AppModals
 *   modals={modals}
 *   isWalletConnected={true}
 *   depositAmount={1000}
 *   exchangeAllocations={exchangeAllocations}
 *   onDeposit={handleDeposit}
 *   // ... other handlers
 * />
 * ```
 */

import type { FC } from "react";
import LoginModal from "../LoginModal";
import DepositModal from "../DepositModal";
import WithdrawModal from "../WithdrawModal";
import TransferModal from "../TransferModal";
import ExchangeSelectionModal from "../ExchangeSelectionModal";
import type { ModalType } from "../../hooks/useModals";

// ============================================================================
// TYPES
// ============================================================================

interface AppModalsProps {
  /** Modal visibility state */
  modals: Record<ModalType, boolean>;
  /** Wallet connection status */
  isWalletConnected: boolean;
  /** Current deposit amount for withdraw max */
  depositAmount: number;
  /** Exchange allocations */
  exchangeAllocations: Record<string, number>;
  /** Handlers */
  onDeposit: (amount: number) => void;
  onWithdraw: (amount: number) => void;
  onTransfer: (
    exchange: string,
    amount: number,
    direction: "toExchange" | "fromExchange",
  ) => void;
  onExchangeSetup: (exchanges: string[]) => void;
  onCloseDeposit: () => void;
  onCloseWithdraw: () => void;
  onCloseTransfer: () => void;
  onCloseExchangeSelection: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * AppModals Component
 *
 * Renders all application modals based on visibility state.
 * Keeps modal logic separate from main app layout.
 */
export const AppModals: FC<AppModalsProps> = ({
  modals,
  isWalletConnected,
  depositAmount,
  exchangeAllocations,
  onDeposit,
  onWithdraw,
  onTransfer,
  onExchangeSetup,
  onCloseDeposit,
  onCloseWithdraw,
  onCloseTransfer,
  onCloseExchangeSelection,
}) => {
  return (
    <>
      {/* Login Modal - Shows when user tries to access protected features without wallet */}
      {modals.login && !isWalletConnected && <LoginModal />}

      {/* Deposit Modal */}
      {modals.deposit && (
        <DepositModal
          onDeposit={onDeposit}
          onClose={onCloseDeposit}
        />
      )}

      {/* Withdraw Modal */}
      {modals.withdraw && (
        <WithdrawModal
          onClose={onCloseWithdraw}
          onWithdraw={onWithdraw}
          maxAmount={depositAmount}
        />
      )}

      {/* Transfer Modal */}
      {modals.transfer && (
        <TransferModal
          onClose={onCloseTransfer}
          onTransfer={onTransfer}
          exchangeBalances={exchangeAllocations}
          vaultBalance={depositAmount}
        />
      )}

      {/* Exchange Selection Modal - Onboarding Step */}
      {modals.exchangeSelection && (
        <ExchangeSelectionModal
          totalAmount={depositAmount}
          onComplete={onExchangeSetup}
          onClose={onCloseExchangeSelection}
        />
      )}
    </>
  );
};

export default AppModals;