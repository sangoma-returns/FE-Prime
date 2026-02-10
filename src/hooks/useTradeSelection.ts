/**
 * Trade Selection Hook
 * 
 * Manages the trade selection flow from the Explore page to Trade page.
 * Handles pre-populating trade data and navigation.
 * 
 * @example
 * ```tsx
 * const { handleTradeSelect } = useTradeSelection(navigateTo);
 * 
 * // In ExplorePage
 * <FundingRateCell 
 *   onClick={() => handleTradeSelect(buyData, sellData)}
 * />
 * ```
 */

import { useCallback } from 'react';
import { useAppStore, type PreselectedTrade } from '../stores/appStore';
import type { Page } from './useNavigation';

// ============================================================================
// TYPES
// ============================================================================

interface UseTradeSelectionProps {
  /** Navigation function */
  navigateTo: (page: Page, queryParams?: string) => void;
}

interface TradeData {
  token: string;
  exchange: string;
  rate: number;
}

interface UseTradeSelectionReturn {
  /** Handle trade selection from Explore page */
  handleTradeSelect: (buyData: TradeData, sellData: TradeData) => void;
  /** Clear preselected trade */
  clearTradeSelection: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing trade selection from Explore page
 * 
 * When users select two funding rate cells in the Explore page,
 * this hook captures that data and navigates to the Trade page
 * with pre-filled exchange and token information.
 * 
 * @param props - Navigation controls
 * @returns Trade selection functions
 */
export function useTradeSelection({
  navigateTo,
}: UseTradeSelectionProps): UseTradeSelectionReturn {
  const setPreselectedTrade = useAppStore((state) => state.setPreselectedTrade);

  /**
   * Handle trade selection
   * 
   * - Captures buy and sell trade data
   * - Updates app state with preselected trade
   * - Navigates to funding-arb page
   */
  const handleTradeSelect = useCallback(
    (buyData: TradeData, sellData: TradeData) => {
      const preselectedTrade: PreselectedTrade = {
        buyToken: buyData.token,
        buyExchange: buyData.exchange,
        sellToken: sellData.token,
        sellExchange: sellData.exchange,
      };

      setPreselectedTrade(preselectedTrade);
      navigateTo('funding-arb');
    },
    [setPreselectedTrade, navigateTo]
  );

  /**
   * Clear preselected trade data
   */
  const clearTradeSelection = useCallback(() => {
    setPreselectedTrade(null);
  }, [setPreselectedTrade]);

  return {
    handleTradeSelect,
    clearTradeSelection,
  };
}