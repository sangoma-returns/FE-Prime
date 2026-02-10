/**
 * Custom Hooks - Barrel Export
 * 
 * Central export point for all custom hooks.
 * Allows for clean imports like: import { useModals, useNavigation } from '../hooks';
 */

export { useModals } from './useModals';
export type { ModalType } from './useModals';

export { useNavigation } from './useNavigation';
export type { Page } from './useNavigation';

export { useOnboarding } from './useOnboarding';
export { useOrderManagement } from './useOrderManagement';
export { useTradeSelection } from './useTradeSelection';

export { useFundingRates } from './useFundingRates';
export { useOrders } from './useOrders';
export { usePortfolio } from './usePortfolio';
export { useAuth } from './useAuth';
export { useSessionRestore } from './useSessionRestore';