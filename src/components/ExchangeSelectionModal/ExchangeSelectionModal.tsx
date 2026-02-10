import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import ExchangeLogo from '../ExchangeLogos';

interface ExchangeSelectionModalProps {
  totalAmount: number;
  onComplete: (exchanges: string[]) => void;
  onClose: () => void;
}

const EXCHANGES = [
  { id: 'hyperliquid', name: 'Hyperliquid', color: 'bg-[#1FBF75]' },
  { id: 'paradex', name: 'Paradex', color: 'bg-[#8B5CF6]' },
  { id: 'aster', name: 'Aster', color: 'bg-[#EC4899]' },
  { id: 'binance', name: 'Binance', color: 'bg-[#F59E0B]' },
  { id: 'bybit', name: 'Bybit', color: 'bg-[#F97316]' },
  { id: 'okx', name: 'OKX', color: 'bg-[#3B82F6]' },
];

export function ExchangeSelectionModal({ totalAmount, onComplete, onClose }: ExchangeSelectionModalProps) {
  const { theme, colors } = useThemeStore();
  const isDark = theme === 'dark';
  // Auto-select Hyperliquid and Paradex on component mount
  const [selectedExchanges, setSelectedExchanges] = useState<string[]>(['hyperliquid', 'paradex']);
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [step, setStep] = useState<'select' | 'allocate'>('select');
  const [hoveredSlider, setHoveredSlider] = useState<string | null>(null);

  // Define allowed exchanges
  const ALLOWED_EXCHANGES = ['hyperliquid', 'paradex'];

  const toggleExchange = (exchangeId: string) => {
    // Only allow toggling for Hyperliquid and Paradex
    if (!ALLOWED_EXCHANGES.includes(exchangeId)) {
      return;
    }

    if (selectedExchanges.includes(exchangeId)) {
      setSelectedExchanges(selectedExchanges.filter(id => id !== exchangeId));
      const newAllocations = { ...allocations };
      delete newAllocations[exchangeId];
      setAllocations(newAllocations);
    } else {
      setSelectedExchanges([...selectedExchanges, exchangeId]);
    }
  };

  const handleContinue = () => {
    if (selectedExchanges.length >= 2) {
      // Lock allocations at 50/50 for Hyperliquid and Paradex
      const initialAllocations: Record<string, number> = {
        hyperliquid: 50,
        paradex: 50
      };
      setAllocations(initialAllocations);
      setStep('allocate');
    }
  };

  const handleAllocationChange = (exchangeId: string, value: number) => {
    setAllocations({ ...allocations, [exchangeId]: value });
  };

  const totalAllocation = Object.values(allocations).reduce((sum, val) => sum + val, 0);

  const handleInitialize = () => {
    if (Math.abs(totalAllocation - 100) < 0.01) {
      // Pass exchange IDs, not names
      onComplete(selectedExchanges);
    }
  };

  return (
    <div className={`fixed inset-0 ${isDark ? 'bg-black/90' : 'bg-black/20'} backdrop-blur-sm flex items-center justify-center z-50 p-4`}>
      <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg max-w-xl w-full p-5 max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-header ${colors.text.primary}`}>
            {step === 'select' ? 'Select Exchanges' : 'Allocate Funds'}
          </h2>
          <button
            onClick={onClose}
            className={`${colors.text.tertiary} hover:${colors.text.primary} transition-colors`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 'select' && (
          <>
            <p className={`${colors.text.secondary} text-body mb-4`}>
              Select at least 2 exchanges (Total: ${totalAmount.toLocaleString()} USDC)
            </p>

            <div className="grid grid-cols-2 gap-1.5 mb-4">
              {EXCHANGES.map((exchange) => {
                const isSelected = selectedExchanges.includes(exchange.id);
                const isAllowed = ALLOWED_EXCHANGES.includes(exchange.id);
                return (
                  <button
                    key={exchange.id}
                    onClick={() => toggleExchange(exchange.id)}
                    disabled={!isAllowed}
                    className={`relative h-11 px-3 py-2 rounded border transition-all ${
                      isSelected
                        ? `${colors.button.primaryBg} border-transparent`
                        : `${colors.bg.subtle} border-transparent ${isAllowed ? colors.state.hover : ''}`
                    } ${!isAllowed ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={isSelected ? 'opacity-90' : ''}>
                        <ExchangeLogo name={exchange.name} className="w-5 h-5" />
                      </div>
                      <span className={`text-button ${isSelected ? 'text-white' : colors.text.primary}`}>{exchange.name}</span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-white/30 rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className={`mb-3 h-9 px-3 flex items-center justify-between ${colors.bg.subtle} border ${colors.border.default} rounded`}>
              <span className={`text-label ${colors.text.secondary}`}>Selected</span>
              <span className={`text-numeric ${colors.text.primary}`}>{selectedExchanges.length} exchanges</span>
              {selectedExchanges.length < 2 && (
                <span className={`text-label ${colors.accent.negative}`}>(Min 2)</span>
              )}
            </div>

            <button
              onClick={handleContinue}
              disabled={selectedExchanges.length < 2}
              className={`w-full h-8 ${colors.button.primaryBg} hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed ${colors.button.primaryText} rounded text-button transition-all`}
            >
              Continue to Allocation
            </button>
          </>
        )}

        {step === 'allocate' && (
          <>
            <p className={`${colors.text.secondary} text-body mb-4`}>
              Distribute ${totalAmount.toLocaleString()} USDC across selected exchanges
            </p>

            <div className="space-y-2 mb-4">
              {selectedExchanges.map((exchangeId) => {
                const exchange = EXCHANGES.find(e => e.id === exchangeId);
                if (!exchange) return null;
                
                const allocationPercent = allocations[exchangeId] || 0;
                const allocationAmount = (totalAmount * allocationPercent) / 100;

                return (
                  <div key={exchangeId} className={`${colors.bg.subtle} border ${colors.border.default} rounded p-2.5 opacity-60`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <ExchangeLogo name={exchange.name} className="w-5 h-5" />
                        <span className={`text-button ${colors.text.primary}`}>{exchange.name}</span>
                      </div>
                      <div className="text-right">
                        <div className={`text-numeric ${colors.text.primary}`}>${allocationAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                        <div className={`text-label ${colors.text.tertiary}`}>{allocationPercent.toFixed(1)}%</div>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.1"
                        value={allocationPercent}
                        disabled
                        onMouseEnter={() => setHoveredSlider(exchangeId)}
                        onMouseLeave={() => setHoveredSlider(null)}
                        onChange={(e) => handleAllocationChange(exchangeId, parseFloat(e.target.value))}
                        className={`w-full h-1 bg-black/[0.08] rounded-full appearance-none cursor-not-allowed [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#1FBF75] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-not-allowed`}
                      />
                      {hoveredSlider === exchangeId && (
                        <div className={`absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 ${colors.bg.surface} border ${colors.border.default} rounded shadow-lg whitespace-nowrap z-10`}>
                          <span className={`text-label ${colors.text.secondary}`}>Coming soon</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={`mb-3 h-9 px-3 flex items-center justify-between ${colors.bg.subtle} border ${colors.border.default} rounded`}>
              <span className={`text-label ${colors.text.secondary}`}>Total Allocation</span>
              <span className={`text-numeric ${
                Math.abs(totalAllocation - 100) < 0.01 ? colors.accent.positive : colors.accent.negative
              }`}>
                {totalAllocation.toFixed(1)}%
              </span>
            </div>
            {Math.abs(totalAllocation - 100) >= 0.01 && (
              <p className={`text-body ${colors.accent.negative} mb-3`}>
                Allocation must equal 100%
              </p>
            )}

            <div className="flex gap-1.5">
              <button
                onClick={() => setStep('select')}
                className={`flex-1 h-8 ${colors.bg.subtle} border ${colors.border.default} ${colors.state.hover} ${colors.text.primary} rounded text-button transition-all`}
              >
                Back
              </button>
              <button
                onClick={handleInitialize}
                disabled={Math.abs(totalAllocation - 100) >= 0.01}
                className={`flex-1 h-8 ${colors.button.primaryBg} hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed ${colors.button.primaryText} rounded text-button transition-all`}
              >
                Initialize Accounts
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}