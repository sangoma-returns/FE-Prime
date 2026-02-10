/**
 * Onboarding Hook
 * 
 * Manages the user onboarding flow including:
 * - Deposit step
 * - Exchange selection step
 * - Navigation between steps
 * 
 * This hook orchestrates the modal flow and state updates during onboarding.
 * 
 * @example
 * ```tsx
 * const { handleDeposit, handleExchangeSetup } = useOnboarding();
 * 
 * // In DepositModal
 * <DepositModal onDeposit={handleDeposit} />
 * ```
 */

import { useCallback } from 'react';
import { useAppStore } from '../stores/appStore';
import type { ModalType } from './useModals';

// ============================================================================
// TYPES
// ============================================================================

interface UseOnboardingProps {
  /** Function to open a specific modal */
  openModal: (modal: ModalType) => void;
  /** Function to close a specific modal */
  closeModal: (modal: ModalType) => void;
}

interface UseOnboardingReturn {
  /** Handle deposit submission (step 1 of onboarding) */
  handleDeposit: (amount: number) => void;
  /** Handle exchange selection (step 2 of onboarding) */
  handleExchangeSetup: (exchanges: string[]) => void;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing onboarding flow
 * 
 * Coordinates between modal state and app state during the onboarding process.
 * Automatically progresses through steps (deposit -> exchange selection).
 * 
 * @param props - Modal control functions
 * @returns Onboarding handler functions
 */
export function useOnboarding({
  openModal,
  closeModal,
}: UseOnboardingProps): UseOnboardingReturn {
  const completeDeposit = useAppStore((state) => state.completeDeposit);
  const setupExchanges = useAppStore((state) => state.setupExchanges);

  /**
   * Handle deposit completion
   * 
   * - Updates deposit amount in app state
   * - Marks deposit as complete
   * - Closes deposit modal
   * - Opens exchange selection modal
   */
  const handleDeposit = useCallback(
    (amount: number) => {
      completeDeposit(amount);
      closeModal('deposit');
      openModal('exchangeSelection');
    },
    [completeDeposit, openModal, closeModal]
  );

  /**
   * Handle exchange setup completion
   * 
   * - Updates selected exchanges in app state
   * - Marks onboarding as complete
   * - Closes exchange selection modal
   */
  const handleExchangeSetup = useCallback(
    (exchanges: string[]) => {
      setupExchanges(exchanges);
      closeModal('exchangeSelection');
    },
    [setupExchanges, closeModal]
  );

  return {
    handleDeposit,
    handleExchangeSetup,
  };
}