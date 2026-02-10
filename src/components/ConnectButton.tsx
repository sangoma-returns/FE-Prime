/**
 * Connect Button Component - Mock Implementation
 * 
 * Legacy component - replaced by CustomConnectButton with mock wallet
 */

import { FC, useState } from 'react';
import { useMockWallet } from '../contexts/MockWalletContext';
import { Button } from './ui/button';
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';
import { toast } from 'sonner@2.0.3';

const ConnectButton: FC = () => {
  const { colors } = useThemeStore();
  const { address, isConnected, connect, disconnect } = useMockWallet();
  const [showMenu, setShowMenu] = useState(false);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success('Address copied to clipboard');
    }
  };

  if (!isConnected) {
    return (
      <Button onClick={connect} className="gap-2">
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`h-8 px-3 flex items-center gap-2 ${colors.bg.subtle} border ${colors.border.default} rounded ${colors.state.hover} transition-colors`}
      >
        <span className={`text-button ${colors.text.secondary}`}>
          {formatAddress(address || '')}
        </span>
        <ChevronDown className="h-3 w-3" />
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
                <Copy className="h-4 w-4" />
                <span className={colors.text.secondary}>Copy Address</span>
              </button>
              <button
                onClick={() => {
                  disconnect();
                  setShowMenu(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-button ${colors.state.hover} rounded transition-colors text-red-600 dark:text-red-400`}
              >
                <LogOut className="h-4 w-4" />
                Disconnect
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ConnectButton;
