import { X } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';

interface MultiOrderConfirmationProps {
  onClose: () => void;
  onConfirm: () => void;
  buyAccount: string;
  buyPair: string;
  buyQuantity: string;
  buyLeverage: string;
  sellAccount: string;
  sellPair: string;
  sellQuantity: string;
  sellLeverage: string;
  duration: string;
  exposure: number;
  passiveness: number;
  discretion: number;
  alphaTilt: number;
  directionalBias: number;
  clipSize: string;
  passiveOnly: boolean;
  activeLimit: boolean;
  reduceOnly: boolean;
  strictDuration: boolean;
}

export function MultiOrderConfirmation({
  onClose,
  onConfirm,
  buyAccount,
  buyPair,
  buyQuantity,
  buyLeverage,
  sellAccount,
  sellPair,
  sellQuantity,
  sellLeverage,
  duration,
  exposure,
  passiveness,
  discretion,
  alphaTilt,
  directionalBias,
  clipSize,
  passiveOnly,
  activeLimit,
  reduceOnly,
  strictDuration,
}: MultiOrderConfirmationProps) {
  const { theme, colors } = useThemeStore();
  const isDark = theme === 'dark';

  // Format exchange name for display
  const formatExchangeName = (exchange: string) => {
    const names: Record<string, string> = {
      'hyperliquid': 'Hyperliquid',
      'paradex': 'Paradex',
      'aster': 'Aster',
      'binance': 'Binance',
      'bybit': 'Bybit',
      'okx': 'OKX',
    };
    return names[exchange] || exchange;
  };

  // Get icon for exchange
  const getExchangeIcon = (exchange: string) => {
    const icons: Record<string, string> = {
      'hyperliquid': '💧',
      'paradex': '◈',
      'aster': '✦',
      'binance': '⬡',
      'bybit': '⬢',
      'okx': '○',
    };
    return icons[exchange] || '●';
  };

  // Get icon for pair
  const getPairIcon = (pair: string) => {
    if (pair.includes('BTC')) return '₿';
    if (pair.includes('ETH')) return 'Ξ';
    if (pair.includes('SOL')) return '◎';
    if (pair.includes('XRP')) return '✕';
    if (pair.includes('DOGE')) return 'Ð';
    return '◆';
  };

  // Convert slider values to display values
  const getExposureTolerance = () => (exposure / 100 * 0.2).toFixed(1);
  const getPassivenessValue = () => (passiveness / 100 * 0.1).toFixed(2);
  const getDiscretionValue = () => (discretion / 100 * 0.12).toFixed(2);
  const getAlphaTiltValue = () => Math.round(alphaTilt / 100 * 100);
  const getDirectionalBiasValue = () => directionalBias >= 50 ? 'No' : 'No';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`${colors.bg.primary} border ${colors.border.primary} rounded-lg w-[960px] max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${colors.border.primary}`}>
          <h2 className={`text-header ${colors.text.primary}`}>Multi Order Confirmation</h2>
          <button
            onClick={onClose}
            className={`${colors.text.tertiary} ${colors.text.hoverPrimary} transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Buy and Sell Sections */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Buy Section */}
            <div>
              <h3 className="text-sm text-green-500 mb-4">Buy (1 pairs)</h3>
              <div className={`border ${colors.border.secondary} rounded p-4`}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">{getPairIcon(buyPair)}</span>
                  <span className={`text-body ${colors.text.primary}`}>{buyPair || 'BTC:PERP-USDC'}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className={`text-label ${colors.text.tertiary} mb-1`}>Target Quantity</div>
                    <div className={`text-numeric ${colors.text.primary}`}>
                      {(() => {
                        const qty = parseFloat(buyQuantity) || 10;
                        const lev = parseFloat(buyLeverage) || 1;
                        return (qty * lev).toFixed(2);
                      })()} USDC
                    </div>
                  </div>
                  <div>
                    <div className={`text-label ${colors.text.tertiary} mb-1`}>Accounts</div>
                    <div className={`text-numeric text-green-500 flex items-center gap-1.5`}>
                      <span>{getExchangeIcon(buyAccount)}</span>
                      <span>{formatExchangeName(buyAccount)}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className={`text-label ${colors.text.tertiary} mb-1`}>Leverage</div>
                    <div className={`text-numeric ${colors.text.primary}`}>{buyLeverage || '1'}x</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sell Section */}
            <div>
              <h3 className="text-sm text-red-500 mb-4">Sell (1 pairs)</h3>
              <div className={`border ${colors.border.secondary} rounded p-4`}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">{getPairIcon(sellPair)}</span>
                  <span className={`text-body ${colors.text.primary}`}>{sellPair || 'BTC:PERP-USDC'}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className={`text-label ${colors.text.tertiary} mb-1`}>Target Quantity</div>
                    <div className={`text-numeric ${colors.text.primary}`}>
                      {(() => {
                        const qty = parseFloat(sellQuantity) || 10;
                        const lev = parseFloat(sellLeverage) || 1;
                        return (qty * lev).toFixed(2);
                      })()} USDC
                    </div>
                  </div>
                  <div>
                    <div className={`text-label ${colors.text.tertiary} mb-1`}>Accounts</div>
                    <div className={`text-numeric text-red-500 flex items-center gap-1.5`}>
                      <span>{getExchangeIcon(sellAccount)}</span>
                      <span>{formatExchangeName(sellAccount)}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className={`text-label ${colors.text.tertiary} mb-1`}>Leverage</div>
                    <div className={`text-numeric ${colors.text.primary}`}>{sellLeverage || '1'}x</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Strategy Configuration */}
          <div>
            <h3 className={`text-sm ${colors.text.tertiary} mb-4`}>Strategy Configuration</h3>
            <div className="grid grid-cols-4 gap-6">
              {/* Column 1 */}
              <div className="space-y-4">
                <div>
                  <div className={`text-label ${colors.text.quaternary} mb-1`}>Duration</div>
                  <div className={`text-numeric ${colors.text.primary}`}>{duration} min(s)</div>
                </div>
                <div>
                  <div className={`text-label ${colors.text.quaternary} mb-1`}>Discretion</div>
                  <div className={`text-numeric ${colors.text.primary}`}>{getDiscretionValue()}</div>
                </div>
                <div>
                  <div className={`text-label ${colors.text.quaternary} mb-1`}>Reduce Only</div>
                  <div className={`text-numeric ${colors.text.primary}`}>{reduceOnly ? 'Yes' : 'No'}</div>
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-4">
                <div>
                  <div className={`text-label ${colors.text.quaternary} mb-1`}>Trajectory</div>
                  <div className={`text-numeric ${colors.text.primary}`}>TWAP</div>
                </div>
                <div>
                  <div className={`text-label ${colors.text.quaternary} mb-1`}>Alpha Tilt</div>
                  <div className={`text-numeric ${colors.text.primary}`}>{getAlphaTiltValue()}</div>
                </div>
                <div>
                  <div className={`text-label ${colors.text.quaternary} mb-1`}>Strict Duration</div>
                  <div className={`text-numeric ${colors.text.primary}`}>{strictDuration ? 'Yes' : 'No'}</div>
                </div>
              </div>

              {/* Column 3 */}
              <div className="space-y-4">
                <div>
                  <div className={`text-label ${colors.text.quaternary} mb-1`}>Exposure Tolerance</div>
                  <div className={`text-numeric ${colors.text.primary}`}>{getExposureTolerance()}</div>
                </div>
                <div>
                  <div className={`text-label ${colors.text.quaternary} mb-1`}>Passive Only</div>
                  <div className={`text-numeric ${colors.text.primary}`}>{passiveOnly ? 'Yes' : 'No'}</div>
                </div>
                <div>
                  <div className={`text-label ${colors.text.quaternary} mb-1`}>Max Clip Size</div>
                  <div className={`text-numeric ${colors.text.primary}`}>{clipSize || 'Adaptive'}</div>
                </div>
              </div>

              {/* Column 4 */}
              <div className="space-y-4">
                <div>
                  <div className={`text-label ${colors.text.quaternary} mb-1`}>Passiveness</div>
                  <div className={`text-numeric ${colors.text.primary}`}>{getPassivenessValue()}</div>
                </div>
                <div>
                  <div className={`text-label ${colors.text.quaternary} mb-1`}>Active Limit</div>
                  <div className={`text-numeric ${colors.text.primary}`}>{activeLimit ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-3 p-6 border-t ${colors.border.primary}`}>
          <button
            onClick={onClose}
            className={`px-6 py-2 border ${colors.border.secondary} ${colors.text.tertiary} ${colors.bg.hover} text-button rounded transition-colors`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ backgroundColor: '#C9A36A' }}
            className="px-6 py-2 hover:opacity-90 text-white text-button rounded transition-opacity"
          >
            Submit Multi Order
          </button>
        </div>
      </div>
    </div>
  );
}