import { useState } from 'react';
import { X } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';

interface WithdrawModalProps {
  onWithdraw: (amount: number) => void;
  onClose: () => void;
  maxAmount: number;
}

export function WithdrawModal({ onWithdraw, onClose, maxAmount }: WithdrawModalProps) {
  const { theme, colors } = useThemeStore();
  const isDark = theme === 'dark';
  const [amount, setAmount] = useState('');

  const handleWithdraw = () => {
    const parsedAmount = parseFloat(amount);
    if (parsedAmount > 0 && parsedAmount <= maxAmount) {
      onWithdraw(parsedAmount);
    }
  };

  return (
    <div className={`fixed inset-0 ${isDark ? 'bg-black/90' : 'bg-black/20'} backdrop-blur-sm flex items-center justify-center z-50 p-4`}>
      <div className={`${colors.bg.surface} rounded-lg border ${colors.border.default} max-w-md w-full p-5`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-header ${colors.text.primary}`}>Withdraw Funds</h2>
          <button
            onClick={onClose}
            className={`${colors.text.tertiary} hover:${colors.text.primary} transition-colors`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-5">
          <p className={`${colors.text.secondary} text-body mb-4`}>
            Withdraw USDC from your Bitfrost account to HyperEVM
          </p>

          <div className={`${colors.bg.subtle} rounded p-2.5 mb-2 border ${colors.border.default}`}>
            <label className={`text-label ${colors.text.tertiary} mb-1.5 block`}>Network</label>
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 ${colors.button.primaryBg} rounded-full flex items-center justify-center text-white text-[10px] font-semibold`}>H</div>
              <span className={`text-body ${colors.text.primary}`}>HyperEVM</span>
            </div>
          </div>

          <div className={`${colors.bg.subtle} rounded p-2.5 mb-3 border ${colors.border.default}`}>
            <label className={`text-label ${colors.text.tertiary} mb-1.5 block`}>Asset</label>
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 bg-[#2775CA] rounded-full flex items-center justify-center text-white text-[10px] font-bold`}>
                $
              </div>
              <span className={`text-body ${colors.text.primary}`}>USDC</span>
            </div>
          </div>

          <div className="mb-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-label ${colors.text.tertiary}`}>Amount (USDC)</label>
              <span className={`text-label ${colors.text.tertiary}`}>
                Available: ${maxAmount.toLocaleString()}
              </span>
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

          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {[100, 500, 1000, 5000].map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(Math.min(preset, maxAmount).toString())}
                disabled={preset > maxAmount}
                className={`h-7 ${colors.bg.subtle} border ${colors.border.default} ${colors.state.hover} rounded text-label ${colors.text.primary} transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                ${preset}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleWithdraw}
          disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxAmount}
          className={`w-full h-8 ${colors.button.primaryBg} hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed ${colors.button.primaryText} rounded text-button transition-all`}
        >
          Withdraw & Continue
        </button>
      </div>
    </div>
  );
}

export default WithdrawModal;
