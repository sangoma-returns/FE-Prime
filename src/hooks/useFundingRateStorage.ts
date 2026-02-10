import { useEffect, useRef } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

/**
 * Hook to automatically store funding rates every 8 hours
 * Also stores rates on initial mount
 */
export function useFundingRateStorage() {
  const hasInitialized = useRef(false);

  useEffect(() => {
    const storeFundingRates = async () => {
      try {
        console.log('📊 Storing current funding rates to history...');
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-9f8d65d6/funding-rates/store`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Failed to store funding rates (${response.status}):`, errorText);
          return; // Don't throw - just log and continue
        }

        const data = await response.json();
        console.log(`✓ Stored ${data.stored} funding rate snapshots`);
      } catch (err) {
        console.error('❌ Error storing funding rates:', err);
        // Don't throw - just log and continue so app doesn't break
      }
    };

    // Store rates on initial mount (only once)
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      storeFundingRates();
    }

    // Set up interval to store rates every 8 hours
    const EIGHT_HOURS = 8 * 60 * 60 * 1000;
    const interval = setInterval(storeFundingRates, EIGHT_HOURS);

    return () => clearInterval(interval);
  }, []);
}