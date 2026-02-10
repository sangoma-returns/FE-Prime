/**
 * SIWE Prompt Component - Mock Implementation
 * 
 * This component is no longer used with the mock wallet system.
 * Keeping for backwards compatibility but it won't be rendered.
 */

import { useEffect, useState } from 'react';
import { useMockWallet } from '../contexts/MockWalletContext';
import { useAuthStore } from '../stores/authStore';
import { Button } from './ui/button';
import { useThemeStore } from '../stores/themeStore';

interface SiwePromptProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SiwePrompt({ onSuccess, onCancel }: SiwePromptProps) {
  const { colors } = useThemeStore();
  const { address, isConnected } = useMockWallet();
  const { setUser, setStatus } = useAuthStore();
  const [isSigning, setIsSigning] = useState(false);

  // Auto-authenticate when connected (mock)
  useEffect(() => {
    if (isConnected && address) {
      setUser({ address });
      setStatus('authenticated');
      onSuccess?.();
    }
  }, [isConnected, address, setUser, setStatus, onSuccess]);

  const handleSign = async () => {
    setIsSigning(true);
    // Simulate signing delay
    setTimeout(() => {
      if (address) {
        setUser({ address });
        setStatus('authenticated');
        setIsSigning(false);
        onSuccess?.();
      }
    }, 500);
  };

  if (!isConnected || !address) {
    return null;
  }

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50`}>
      <div className={`${colors.bg.surface} rounded-lg p-6 max-w-md w-full mx-4`}>
        <h2 className={`text-h3 ${colors.text.primary} mb-2`}>Sign In</h2>
        <p className={`text-body ${colors.text.secondary} mb-6`}>
          Please sign the message to authenticate your wallet.
        </p>
        
        <div className="flex gap-3">
          <Button
            onClick={handleSign}
            disabled={isSigning}
            className="flex-1"
          >
            {isSigning ? 'Signing...' : 'Sign Message'}
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            disabled={isSigning}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
