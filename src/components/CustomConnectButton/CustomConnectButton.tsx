/**
 * Custom Connect Button Component
 * 
 * Mock wallet connection button for demo purposes
 * Simulates wallet connection without actual web3 libraries
 */

import { Wallet, ChevronDown, LogOut, Copy } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import { useMockWallet } from '../../contexts/MockWalletContext';
import { useAuthStore } from '../../stores/authStore';
import { toast } from 'sonner@2.0.3';
import { useState } from 'react';

interface CustomConnectButtonProps {
  /** Whether to show full width button */
  fullWidth?: boolean;
  /** Custom className for additional styling */
  className?: string;
}

export function CustomConnectButton({ fullWidth = false, className = '' }: CustomConnectButtonProps) {
  const { colors } = useThemeStore();
  const { address, isConnected, connect, disconnect } = useMockWallet();
  const { user, setUser, setStatus } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);

  const handleConnect = () => {
    connect();
    // Auto-authenticate after connecting
    setTimeout(() => {
      const mockAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
      setUser({ address: mockAddress });
      setStatus('authenticated');
      toast.success('Wallet connected!');
    }, 100);
  };

  const handleDisconnect = () => {
    disconnect();
    setShowMenu(false);
    setUser(null);
    setStatus('unauthenticated');
    toast.success('Wallet disconnected');
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success('Address copied!');
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Not connected - show Connect button
  if (!isConnected || !address) {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={handleConnect}
          type="button"
          className={`${fullWidth ? 'w-full' : ''} h-8 px-3 ${colors.button.primaryBg} hover:opacity-90 ${colors.button.primaryText} rounded text-button ${colors.state.active} transition-all flex items-center justify-center gap-2`}
        >
          <Wallet className="w-3.5 h-3.5" />
          Connect Wallet
        </button>
      </div>
    );
  }

  // Connected and authenticated - show account menu
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        type="button"
        className={`h-7 px-2.5 flex items-center gap-1.5 ${colors.bg.subtle} border ${colors.border.default} rounded ${colors.state.hover} transition-colors`}
      >
        <span className={`text-button ${colors.text.secondary}`}>
          {formatAddress(address)}
        </span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className={`absolute right-0 top-full mt-2 w-64 rounded-lg border ${colors.border.default} ${colors.bg.surface} shadow-lg z-50`}>
            <div className={`p-4 border-b ${colors.border.secondary}`}>
              <div className={`text-button ${colors.text.primary} mb-1`}>Connected</div>
              <div className={`text-label ${colors.text.tertiary} font-mono break-all`}>
                {address}
              </div>
            </div>
            <div className="p-2">
              <button
                onClick={copyAddress}
                className={`w-full flex items-center gap-2 px-3 py-2 text-button ${colors.state.hover} rounded transition-colors`}
              >
                <Copy className="w-4 h-4" />
                <span className={colors.text.secondary}>Copy Address</span>
              </button>
              <button
                onClick={handleDisconnect}
                className={`w-full flex items-center gap-2 px-3 py-2 text-button ${colors.state.hover} rounded transition-colors text-red-600 dark:text-red-400`}
              >
                <LogOut className="w-4 h-4" />
                Disconnect
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CustomConnectButton;
