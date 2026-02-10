/**
 * Modal Management Hook
 * 
 * Provides a clean interface for managing modal visibility state.
 * Uses a single state object to avoid multiple useState calls.
 * 
 * @example
 * ```tsx
 * const { modals, openModal, closeModal, closeAllModals } = useModals();
 * 
 * // Open a modal
 * openModal('deposit');
 * 
 * // Check if modal is open
 * {modals.deposit && <DepositModal onClose={() => closeModal('deposit')} />}
 * 
 * // Close all modals
 * closeAllModals();
 * ```
 */

import { useState, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type ModalType = 'deposit' | 'withdraw' | 'exchangeSelection' | 'transfer' | 'login';

type ModalState = Record<ModalType, boolean>;

interface UseModalsReturn {
  /** Current state of all modals */
  modals: ModalState;
  /** Open a specific modal */
  openModal: (modal: ModalType) => void;
  /** Close a specific modal */
  closeModal: (modal: ModalType) => void;
  /** Close all modals */
  closeAllModals: () => void;
  /** Toggle a specific modal */
  toggleModal: (modal: ModalType) => void;
}

// ============================================================================
// HOOK
// ============================================================================

const initialModalState: ModalState = {
  deposit: false,
  withdraw: false,
  exchangeSelection: false,
  transfer: false,
  login: false,
};

/**
 * Hook for managing modal visibility state
 * 
 * @returns Modal state and control functions
 */
export function useModals(): UseModalsReturn {
  const [modals, setModals] = useState<ModalState>(initialModalState);

  const openModal = useCallback((modal: ModalType) => {
    setModals((prev) => ({ ...prev, [modal]: true }));
  }, []);

  const closeModal = useCallback((modal: ModalType) => {
    setModals((prev) => ({ ...prev, [modal]: false }));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals(initialModalState);
  }, []);

  const toggleModal = useCallback((modal: ModalType) => {
    setModals((prev) => ({ ...prev, [modal]: !prev[modal] }));
  }, []);

  return {
    modals,
    openModal,
    closeModal,
    closeAllModals,
    toggleModal,
  };
}

export default useModals;