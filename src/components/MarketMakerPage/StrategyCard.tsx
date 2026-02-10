import { useWatch, Control } from 'react-hook-form@7.55.0';
import { useThemeStore } from '../../stores/themeStore';
import { MultiOrderFormData, TOOLTIPS, StrategyEstimates } from './types';
import { ChevronDown, Trash2, Upload } from 'lucide-react';
import { FormField } from './FormField';
import { Info } from 'lucide-react';
import { Tooltip } from '../Tooltip';

interface StrategyCardProps {
  index: number;
  control: Control<MultiOrderFormData>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRemove: () => void;
  exchanges: string[];
  pairs: string[];
}

export function StrategyCard({
  index,
  control,
  isExpanded,
  onToggleExpand,
  onRemove,
  exchanges,
  pairs,
}: StrategyCardProps) {
  const { colors } = useThemeStore();

  // Watch all strategy fields
  const strategy = useWatch({
    control,
    name: `strategies.${index}`,
  });

  // Calculate estimates
  const calculateStrategyEstimates = (): StrategyEstimates => {
    const marginNum = parseFloat(strategy?.margin || '0');
    const leverageNum = parseFloat(strategy?.leverage || '1');
    const spreadBpsNum = parseFloat(strategy?.spreadBps || '0');
    const maxRunsNum = parseFloat(strategy?.maxRuns || '1');
    
    const volumePerRun = marginNum * leverageNum * 20;
    
    const timePerRunMinutes = {
      aggressive: 5,
      neutral: 15,
      passive: 45,
    }[strategy?.participationRate || 'neutral'];
    
    const maxPossibleRunsPerDay = Math.floor((24 * 60) / timePerRunMinutes);
    
    let actualRunsPerDay = 1;
    if (strategy?.enableAutoRepeat) {
      actualRunsPerDay = Math.min(maxPossibleRunsPerDay, maxRunsNum);
    }
    
    const dailyVolume = volumePerRun * actualRunsPerDay;
    const makerFeeRate = -0.0001;
    const makerFees = dailyVolume * Math.abs(makerFeeRate);
    const spreadCaptureRate = (spreadBpsNum / 10000) / 2;
    const spreadProfit = dailyVolume * spreadCaptureRate;
    const dailyReturn = spreadProfit + makerFees;
    const dailyReturnPercent = marginNum > 0 ? (dailyReturn / marginNum) * 100 : 0;
    const monthlyReturn = dailyReturn * 30;
    const monthlyReturnPercent = marginNum > 0 ? (monthlyReturn / marginNum) * 100 : 0;
    
    return {
      volumePerRun,
      actualRunsPerDay,
      dailyVolume,
      makerFees,
      spreadProfit,
      dailyReturn,
      dailyReturnPercent,
      monthlyReturn,
      monthlyReturnPercent,
    };
  };

  const estimates = calculateStrategyEstimates();
  const isConfigured = strategy?.exchange && strategy?.pair && strategy?.margin;

  return (
    <div className={`border ${colors.border.secondary} rounded-sm overflow-hidden`}>
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-3 ${colors.bg.secondary} cursor-pointer`}
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          <ChevronDown
            className={`w-4 h-4 ${colors.text.tertiary} transition-transform ${
              isExpanded ? '' : '-rotate-90'
            }`}
          />
          <div>
            <div className="text-button font-medium">{strategy?.name || `Strategy ${index + 1}`}</div>
            <div className={`text-[11px] ${colors.text.tertiary}`}>
              {isConfigured
                ? `${strategy.exchange} · ${strategy.pair} · $${parseFloat(strategy.margin || '0').toLocaleString()}`
                : 'Not configured'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConfigured && (
            <div className="text-right mr-4">
              <div className={`text-[11px] ${colors.text.tertiary}`}>Est. Daily Return</div>
              <div className={`text-button font-medium ${colors.text.green}`}>
                +${estimates.dailyReturn.toFixed(2)}
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className={`p-2 ${colors.text.tertiary} hover:${colors.text.red} transition-colors`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className={`p-4 ${colors.bg.tertiary} space-y-4`}>
          {/* Market Selection */}
          <div>
            <h4 className="text-[11px] font-medium mb-2">Market Selection</h4>
            <div className="grid grid-cols-3 gap-2">
              <FormField
                label="Exchange"
                // Note: In production, you'd use register from useFormContext
                defaultValue={strategy?.exchange}
                placeholder="Select"
              />
              <FormField
                label="Pair"
                defaultValue={strategy?.pair}
                placeholder="Select"
              />
              <FormField
                label="Margin (USDC)"
                defaultValue={strategy?.margin}
                placeholder="100"
                type="number"
              />
            </div>
          </div>

          {/* Parameters Grid */}
          <div className="grid grid-cols-3 gap-2">
            <FormField
              label="Leverage"
              defaultValue={strategy?.leverage}
              type="number"
            />
            <FormField
              label="Spread (bps)"
              tooltip={TOOLTIPS.baseSpread}
              defaultValue={strategy?.spreadBps}
              type="number"
            />
            <FormField
              label="Order Levels"
              tooltip={TOOLTIPS.orderLevels}
              defaultValue={strategy?.orderLevels}
              type="number"
            />
            <FormField
              label="Order Amount"
              tooltip={TOOLTIPS.orderAmount}
              defaultValue={strategy?.orderAmount}
              type="number"
            />
            <FormField
              label="Refresh (s)"
              tooltip={TOOLTIPS.refreshTime}
              defaultValue={strategy?.refreshTime}
              type="number"
            />
            <FormField
              label="Inventory Skew"
              tooltip={TOOLTIPS.inventorySkew}
              defaultValue={strategy?.inventorySkew}
              type="number"
            />
          </div>

          {/* Performance Estimates */}
          {isConfigured && (
            <div className={`p-3 ${colors.bg.secondary} border ${colors.border.secondary} rounded-sm`}>
              <div className="text-[11px] font-medium mb-2">Performance Estimates</div>
              <div className="grid grid-cols-4 gap-3 text-[11px]">
                <div>
                  <div className={colors.text.tertiary}>Volume/Run</div>
                  <div className="font-medium mt-0.5">
                    ${estimates.volumePerRun.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div>
                  <div className={colors.text.tertiary}>Runs/Day</div>
                  <div className="font-medium mt-0.5">
                    {estimates.actualRunsPerDay}
                  </div>
                </div>
                <div>
                  <div className={colors.text.tertiary}>Daily Volume</div>
                  <div className="font-medium mt-0.5">
                    ${estimates.dailyVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div>
                  <div className={colors.text.tertiary}>Monthly Return</div>
                  <div className={`font-medium mt-0.5 ${colors.text.green}`}>
                    +${estimates.monthlyReturn.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}