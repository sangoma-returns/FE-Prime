import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface FundingRateSnapshot {
  timestamp: number;
  rate: number;
  token: string;
  exchange: string;
}

interface UseFundingRateHistoryResult {
  buyHistory: FundingRateSnapshot[];
  sellHistory: FundingRateSnapshot[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch historical funding rates for a trading pair
 * NOTE: Currently using static placeholder data - API integration temporarily disabled
 */
export function useFundingRateHistory(
  buyToken: string,
  buyExchange: string,
  sellToken: string,
  sellExchange: string
) {
  const [buyHistory, setBuyHistory] = useState<FundingRateSnapshot[]>([]);
  const [sellHistory, setSellHistory] = useState<FundingRateSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(false); // No loading for static data

  useEffect(() => {
    // Generate static placeholder data for 7 days (21 funding periods @ 8 hours each)
    const generatePlaceholderHistory = (token: string, exchange: string, baseRate: number, phaseShift: number = 0) => {
      const now = Date.now();
      const EIGHT_HOURS = 8 * 60 * 60 * 1000;
      const history: FundingRateSnapshot[] = [];
      
      // Generate 21 data points going back 7 days
      // Add phase shift so buy and sell rates cross over each other
      for (let i = 20; i >= 0; i--) {
        const timestamp = now - (i * EIGHT_HOURS);
        // Add small sinusoidal variation that creates crossover between buy/sell
        const phase = (i / 20) * Math.PI * 3 + phaseShift; // 3 cycles over 7 days
        const sineVariation = Math.sin(phase) * 0.25; // ±0.25% variation (much smaller)
        const randomNoise = (Math.random() - 0.5) * 0.05; // ±0.025% random noise
        const rate = baseRate + sineVariation + randomNoise;
        
        history.push({
          timestamp,
          rate: Math.max(0, rate), // Ensure non-negative
          token,
          exchange,
        });
      }
      
      return history;
    };
    
    // Use similar base rates so they cross over
    // The phase shift will cause them to oscillate in and out of phase
    const baseRate = buyToken === 'BTC' ? 5.0 : 7.5;
    
    // Generate with different phase shifts so buy and sell cross over each other
    const buyData = generatePlaceholderHistory(buyToken, buyExchange, baseRate, 0);
    const sellData = generatePlaceholderHistory(sellToken, sellExchange, baseRate, Math.PI); // 180° out of phase
    
    console.log(`📊 Generated placeholder funding rate history:`, {
      buy: `${buyData.length} periods for ${buyToken} on ${buyExchange} (base ${baseRate}% APR)`,
      sell: `${sellData.length} periods for ${sellToken} on ${sellExchange} (base ${baseRate}% APR)`,
      note: 'Rates oscillate in opposite phases to create spread that crosses zero'
    });
    
    setBuyHistory(buyData);
    setSellHistory(sellData);
    
    // ORIGINAL API CODE - Currently disabled
    // const fetchHistory = async () => {
    //   try {
    //     setIsLoading(true);
    //     const [buyResponse, sellResponse] = await Promise.all([
    //       fetch(
    //         `https://${projectId}.supabase.co/functions/v1/make-server-4cdc6d7b/funding-rates/history/${buyToken}/${buyExchange}`,
    //         { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
    //       ),
    //       fetch(
    //         `https://${projectId}.supabase.co/functions/v1/make-server-4cdc6d7b/funding-rates/history/${sellToken}/${sellExchange}`,
    //         { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
    //       ),
    //     ]);
    //     if (!buyResponse.ok || !sellResponse.ok) {
    //       console.warn('⚠ Failed to fetch funding rate history');
    //       setBuyHistory([]);
    //       setSellHistory([]);
    //       return;
    //     }
    //     const buyData = await buyResponse.json();
    //     const sellData = await sellResponse.json();
    //     setBuyHistory(buyData.history || []);
    //     setSellHistory(sellData.history || []);
    //   } catch (err) {
    //     console.error('❌ Error fetching funding rate history:', err);
    //     setBuyHistory([]);
    //     setSellHistory([]);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };
    // if (buyToken && buyExchange && sellToken && sellExchange) {
    //   fetchHistory();
    // }
  }, [buyToken, buyExchange, sellToken, sellExchange]);

  return {
    buyHistory,
    sellHistory,
    isLoading,
    error: null,
  };
}