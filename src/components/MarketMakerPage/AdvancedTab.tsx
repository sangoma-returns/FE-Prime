import { UseFormReturn } from 'react-hook-form@7.55.0';
import { useThemeStore } from '../../stores/themeStore';
import { MarketMakerFormData, TOOLTIPS } from './types';
import { Info } from 'lucide-react';
import { Tooltip } from '../Tooltip';
import { StrategySummary } from './StrategySummary';
import { FormField } from './FormField';

interface AdvancedTabProps {
  form: UseFormReturn<MarketMakerFormData>;
  onShowExchangePairSelector: () => void;
}

export function AdvancedTab({
  form,
  onShowExchangePairSelector,
}: AdvancedTabProps) {
  const { colors } = useThemeStore();
  const { register, watch, setValue, control, formState: { errors } } = form;

  const selectedExchange = watch('exchange');
  const selectedPair = watch('pair');
  const participationRate = watch('participationRate');
  const enableAutoRepeat = watch('enableAutoRepeat');
  const enablePnlTolerance = watch('enablePnlTolerance');

  return (
    <div className="grid grid-cols-[1fr,350px] gap-6">
      {/* Left Column - Configuration */}
      <div className="space-y-6">
        {/* Exchange & Pair Selection */}
        <div>
          <h3 className="text-button font-medium mb-3">Market Selection</h3>
          <div className={`p-4 ${colors.bg.secondary} border ${colors.border.secondary} rounded-sm space-y-3`}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-[11px] font-medium ${colors.text.secondary} mb-1.5`}>
                  Exchange
                </label>
                <button
                  type="button"
                  onClick={onShowExchangePairSelector}
                  className={`w-full px-3 py-2 text-left text-button border ${colors.border.secondary} ${colors.bg.tertiary} rounded-sm hover:${colors.border.primary} transition-colors`}
                >
                  {selectedExchange || 'Select Exchange'}
                </button>
                {errors.exchange && (
                  <p className="mt-1 text-[11px] text-red-500">{errors.exchange.message}</p>
                )}
              </div>

              <div>
                <label className={`block text-[11px] font-medium ${colors.text.secondary} mb-1.5`}>
                  Trading Pair
                </label>
                <button
                  type="button"
                  onClick={onShowExchangePairSelector}
                  className={`w-full px-3 py-2 text-left text-button border ${colors.border.secondary} ${colors.bg.tertiary} rounded-sm hover:${colors.border.primary} transition-colors`}
                >
                  {selectedPair || 'Select Pair'}
                </button>
                {errors.pair && (
                  <p className="mt-1 text-[11px] text-red-500">{errors.pair.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Position Parameters */}
        <div>
          <h3 className="text-button font-medium mb-3">Position Parameters</h3>
          <div className={`p-4 ${colors.bg.secondary} border ${colors.border.secondary} rounded-sm space-y-3`}>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Margin (USDC)"
                {...register('margin')}
                error={errors.margin?.message}
                placeholder="100"
                type="number"
                step="0.01"
              />
              <FormField
                label="Leverage"
                {...register('leverage')}
                error={errors.leverage?.message}
                placeholder="1"
                type="number"
                step="0.1"
              />
            </div>
          </div>
        </div>

        {/* Market Making Parameters */}
        <div>
          <h3 className="text-button font-medium mb-3">Market Making Parameters</h3>
          <div className={`p-4 ${colors.bg.secondary} border ${colors.border.secondary} rounded-sm space-y-3`}>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Base Spread (bps)"
                tooltip={TOOLTIPS.baseSpread}
                {...register('spreadBps')}
                error={errors.spreadBps?.message}
                placeholder="10"
                type="number"
                step="0.1"
              />
              <FormField
                label="Order Levels"
                tooltip={TOOLTIPS.orderLevels}
                {...register('orderLevels')}
                error={errors.orderLevels?.message}
                placeholder="5"
                type="number"
              />
              <FormField
                label="Order Amount (USDC)"
                tooltip={TOOLTIPS.orderAmount}
                {...register('orderAmount')}
                error={errors.orderAmount?.message}
                placeholder="100"
                type="number"
                step="0.01"
              />
              <FormField
                label="Refresh Time (s)"
                tooltip={TOOLTIPS.refreshTime}
                {...register('refreshTime')}
                error={errors.refreshTime?.message}
                placeholder="5"
                type="number"
              />
              <FormField
                label="Inventory Skew"
                tooltip={TOOLTIPS.inventorySkew}
                {...register('inventorySkew')}
                error={errors.inventorySkew?.message}
                placeholder="0"
                type="number"
                step="0.1"
              />
            </div>
          </div>
        </div>

        {/* Risk Parameters */}
        <div>
          <h3 className="text-button font-medium mb-3">Risk Parameters</h3>
          <div className={`p-4 ${colors.bg.secondary} border ${colors.border.secondary} rounded-sm space-y-3`}>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Min Spread (bps)"
                tooltip={TOOLTIPS.minSpread}
                {...register('minSpread')}
                error={errors.minSpread?.message}
                placeholder="5"
                type="number"
                step="0.1"
              />
              <FormField
                label="Max Spread (bps)"
                tooltip={TOOLTIPS.maxSpread}
                {...register('maxSpread')}
                error={errors.maxSpread?.message}
                placeholder="50"
                type="number"
                step="0.1"
              />
              <FormField
                label="Stop Loss (%)"
                tooltip={TOOLTIPS.stopLoss}
                {...register('stopLoss')}
                error={errors.stopLoss?.message}
                placeholder="2"
                type="number"
                step="0.1"
              />
              <FormField
                label="Take Profit (%)"
                tooltip={TOOLTIPS.takeProfit}
                {...register('takeProfit')}
                error={errors.takeProfit?.message}
                placeholder="5"
                type="number"
                step="0.1"
              />
            </div>
          </div>
        </div>

        {/* Participation Rate */}
        <div>
          <h3 className="text-button font-medium mb-3 flex items-center gap-2">
            Participation Rate
            <Tooltip content={TOOLTIPS.participationRate} position="right">
              <Info className={`w-3.5 h-3.5 ${colors.text.tertiary}`} />
            </Tooltip>
          </h3>
          <div className={`p-4 ${colors.bg.secondary} border ${colors.border.secondary} rounded-sm`}>
            <div className="flex gap-2">
              {(['passive', 'neutral', 'aggressive'] as const).map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setValue('participationRate', rate)}
                  className={`flex-1 px-3 py-2 text-button font-medium border rounded-sm transition-colors ${
                    participationRate === rate
                      ? `${colors.bg.brand} ${colors.text.brandContrast} border-transparent`
                      : `${colors.bg.tertiary} ${colors.text.secondary} ${colors.border.secondary} hover:${colors.border.primary}`
                  }`}
                >
                  <div className="capitalize">{rate}</div>
                  <div className="text-[10px] opacity-70">
                    {rate === 'aggressive' && '5 min'}
                    {rate === 'neutral' && '15 min'}
                    {rate === 'passive' && '30-60 min'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Auto-Repeat Settings */}
        <div>
          <h3 className="text-button font-medium mb-3">Auto-Repeat Settings</h3>
          <div className={`p-4 ${colors.bg.secondary} border ${colors.border.secondary} rounded-sm space-y-3`}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('enableAutoRepeat')}
                className="w-4 h-4 rounded"
              />
              <span className="text-button">Enable Auto-Repeat</span>
              <Tooltip content={TOOLTIPS.autoRepeat} position="right">
                <Info className={`w-3.5 h-3.5 ${colors.text.tertiary}`} />
              </Tooltip>
            </label>

            {enableAutoRepeat && (
              <>
                <FormField
                  label="Max Runs"
                  tooltip={TOOLTIPS.maxRuns}
                  {...register('maxRuns')}
                  error={errors.maxRuns?.message}
                  placeholder="3"
                  type="number"
                />

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('enablePnlTolerance')}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-button">Enable PNL Tolerance</span>
                  <Tooltip content={TOOLTIPS.pnlTolerance} position="right">
                    <Info className={`w-3.5 h-3.5 ${colors.text.tertiary}`} />
                  </Tooltip>
                </label>

                {enablePnlTolerance && (
                  <FormField
                    label="Tolerance (%)"
                    tooltip={TOOLTIPS.tolerancePercent}
                    {...register('tolerancePercent')}
                    error={errors.tolerancePercent?.message}
                    placeholder="2"
                    type="number"
                    step="0.1"
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Summary & Actions */}
      <div className="space-y-4">
        <StrategySummary control={control} />

        <button
          type="submit"
          className={`w-full px-4 py-3 ${colors.bg.brand} ${colors.text.brandContrast} rounded-sm font-medium hover:opacity-90 transition-opacity`}
        >
          Deploy Strategy
        </button>
      </div>
    </div>
  );
}