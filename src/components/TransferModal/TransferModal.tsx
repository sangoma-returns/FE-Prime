import { useState } from 'react';
import { X, ArrowLeftRight } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import { useAppStore } from '../../stores/appStore';

interface TransferModalProps {
  onTransfer: (exchange: string, amount: number, direction: 'toExchange' | 'fromExchange') => void;
  onClose: () => void;
  exchangeBalances: Record<string, number>;
  vaultBalance: number;
}

export function TransferModal({ onTransfer, onClose, exchangeBalances, vaultBalance }: TransferModalProps) {
  const { theme, colors } = useThemeStore();
  const selectedExchanges = useAppStore((s) => s.selectedExchanges);
  const isDark = theme === 'dark';
  
  const [selectedExchange, setSelectedExchange] = useState<string>(selectedExchanges[0] || '');
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<'toExchange' | 'fromExchange'>('fromExchange');

  // Get exchange names for display
  const exchangeNames: Record<string, string> = {
    hyperliquid: 'Hyperliquid',
    paradex: 'Paradex',
    aster: 'Aster',
    binance: 'Binance',
    bybit: 'Bybit',
    okx: 'OKX',
  };

  // Calculate max transferable amount based on direction
  const maxAmount = direction === 'fromExchange' 
    ? (exchangeBalances[selectedExchange] || 0)
    : vaultBalance;

  const handleTransfer = () => {
    const parsedAmount = parseFloat(amount);
    if (parsedAmount > 0 && parsedAmount <= maxAmount && selectedExchange) {
      onTransfer(selectedExchange, parsedAmount, direction);
    }
  };

  const toggleDirection = () => {
    setDirection(prev => prev === 'fromExchange' ? 'toExchange' : 'fromExchange');
    setAmount(''); // Reset amount when switching direction
  };

  return (
    <div className={`fixed inset-0 ${isDark ? 'bg-black/90' : 'bg-black/20'} backdrop-blur-sm flex items-center justify-center z-50 p-4`}>
      <div className={`${colors.bg.surface} rounded-lg border ${colors.border.default} max-w-md w-full p-5`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-header ${colors.text.primary}`}>Transfer</h2>
          <button
            onClick={onClose}
            className={`${colors.text.tertiary} hover:${colors.text.primary} transition-colors`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-5">
          {/* Direction Indicator */}
          <div className="mb-4 flex items-center justify-center gap-3">
            <span className={`text-body ${colors.text.primary} font-medium`}>
              {direction === 'fromExchange' ? 'EXCHANGE' : 'BITFROST ACCOUNT'}
            </span>
            <button
              onClick={toggleDirection}
              className={`${colors.bg.subtle} border ${colors.border.default} rounded p-2 ${colors.state.hover} transition-all`}
              title="Switch direction"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
            <span className={`text-body ${colors.text.primary} font-medium`}>
              {direction === 'fromExchange' ? 'BITFROST ACCOUNT' : 'EXCHANGE'}
            </span>
          </div>

          {/* Exchange Selector */}
          <div className="mb-3">
            <label className={`text-label ${colors.text.tertiary} mb-1.5 block`}>
              {direction === 'fromExchange' ? 'From Exchange' : 'To Exchange'}
            </label>
            <select
              value={selectedExchange}
              onChange={(e) => setSelectedExchange(e.target.value)}
              className={`w-full h-8 ${colors.input.bg} border ${colors.input.border} rounded px-2.5 text-body ${colors.input.text} ${colors.state.focus} transition-all`}
            >
              {selectedExchanges.map((exchange) => (
                <option key={exchange} value={exchange}>
                  {exchangeNames[exchange] || exchange}
                </option>
              ))}
            </select>
          </div>

          {/* Balance Info */}
          <div className={`${colors.bg.subtle} rounded p-2.5 mb-3 border ${colors.border.default}`}>
            <div className="flex items-center justify-between mb-1">
              <label className={`text-label ${colors.text.tertiary}`}>
                {direction === 'fromExchange' ? 'Withdrawable Balance' : 'Idle Account balance'}
              </label>
              <span className={`text-label ${colors.text.primary}`}>
                ${maxAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-label ${colors.text.tertiary}`}>Amount (USDC)</label>
              <button
                onClick={() => setAmount(maxAmount.toString())}
                className={`text-label ${colors.text.secondary} hover:${colors.text.primary} transition-colors`}
              >
                Max
              </button>
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={`w-full h-8 ${colors.input.bg} border ${colors.input.border} rounded px-2.5 text-numeric ${colors.input.text} ${colors.input.placeholder} ${colors.state.focus} transition-all`}
              min="0"
              max={maxAmount}
              step="0.01"
            />
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {[25, 50, 75, 100].map((percentage) => (
              <button
                key={percentage}
                onClick={() => setAmount((maxAmount * (percentage / 100)).toFixed(2))}
                disabled={maxAmount === 0}
                className={`h-7 ${colors.bg.subtle} border ${colors.border.default} ${colors.state.hover} rounded text-label ${colors.text.primary} transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {percentage}%
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleTransfer}
          disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxAmount || !selectedExchange}
          className={`w-full h-8 ${colors.button.primaryBg} hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed ${colors.button.primaryText} rounded text-button transition-all`}
        >
          Transfer
        </button>
      </div>
    </div>
  );
}

export default TransferModal;