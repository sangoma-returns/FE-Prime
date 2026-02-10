import { useState } from 'react';
import { UseFieldArrayReturn, Control } from 'react-hook-form@7.55.0';
import { useThemeStore } from '../../stores/themeStore';
import { MultiOrderFormData, StrategyFormData } from './types';
import { Plus, ChevronDown, Upload, Trash2 } from 'lucide-react';
import { StrategyCard } from './StrategyCard';

interface MultiOrderTabProps {
  control: Control<MultiOrderFormData>;
  fieldArray: UseFieldArrayReturn<MultiOrderFormData, 'strategies', 'id'>;
  exchanges: string[];
  pairs: string[];
  onDeploy: () => void;
  onSimulate: () => void;
}

export function MultiOrderTab({
  control,
  fieldArray,
  exchanges,
  pairs,
  onDeploy,
  onSimulate,
}: MultiOrderTabProps) {
  const { colors } = useThemeStore();
  const { fields, append, remove } = fieldArray;
  
  const [expandedStrategies, setExpandedStrategies] = useState<Set<string>>(new Set(['0']));

  const toggleStrategyExpansion = (index: number) => {
    setExpandedStrategies(prev => {
      const newSet = new Set(prev);
      const key = index.toString();
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const addStrategy = () => {
    const newIndex = fields.length;
    append({
      id: `strategy-${Date.now()}`,
      name: `Strategy ${newIndex + 1}`,
      exchange: '',
      pair: '',
      margin: '',
      leverage: '1',
      spreadBps: '10',
      orderLevels: '5',
      orderAmount: '100',
      refreshTime: '5',
      inventorySkew: '0',
      minSpread: '5',
      maxSpread: '50',
      stopLoss: '2',
      takeProfit: '5',
      participationRate: 'neutral',
      enableAutoRepeat: false,
      maxRuns: '3',
      enablePnlTolerance: false,
      tolerancePercent: '2',
      expanded: true,
      submitted: false,
    });
    setExpandedStrategies(prev => new Set([...prev, newIndex.toString()]));
  };

  return (
    <div className="max-w-[1400px]">
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-button font-medium">Multi-Strategy Configuration</h3>
          <p className={`text-[11px] ${colors.text.tertiary} mt-0.5`}>
            Configure multiple strategies and deploy them simultaneously
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSimulate}
            className={`px-3 py-2 text-button ${colors.bg.tertiary} border ${colors.border.secondary} rounded-sm hover:${colors.border.primary} transition-colors`}
          >
            Simulate Portfolio
          </button>
          <button
            type="button"
            onClick={addStrategy}
            className={`flex items-center gap-2 px-3 py-2 text-button ${colors.bg.brand} ${colors.text.brandContrast} rounded-sm hover:opacity-90 transition-opacity`}
          >
            <Plus className="w-4 h-4" />
            Add Strategy
          </button>
        </div>
      </div>

      {/* Strategies List */}
      <div className="space-y-3 mb-4">
        {fields.map((field, index) => (
          <StrategyCard
            key={field.id}
            index={index}
            control={control}
            isExpanded={expandedStrategies.has(index.toString())}
            onToggleExpand={() => toggleStrategyExpansion(index)}
            onRemove={() => {
              remove(index);
              setExpandedStrategies(prev => {
                const newSet = new Set(prev);
                newSet.delete(index.toString());
                return newSet;
              });
            }}
            exchanges={exchanges}
            pairs={pairs}
          />
        ))}
      </div>

      {/* Deploy All Button */}
      {fields.length > 0 && (
        <div className={`sticky bottom-4 p-4 ${colors.bg.secondary} border ${colors.border.secondary} rounded-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-button font-medium">
                {fields.length} {fields.length === 1 ? 'Strategy' : 'Strategies'} Configured
              </div>
              <div className={`text-[11px] ${colors.text.tertiary}`}>
                Ready to deploy to market
              </div>
            </div>
            <button
              type="button"
              onClick={onDeploy}
              className={`px-6 py-3 text-button font-medium ${colors.bg.brand} ${colors.text.brandContrast} rounded-sm hover:opacity-90 transition-opacity`}
            >
              Deploy All Strategies
            </button>
          </div>
        </div>
      )}

      {fields.length === 0 && (
        <div className={`p-12 text-center ${colors.bg.secondary} border ${colors.border.secondary} rounded-sm`}>
          <div className={`text-button ${colors.text.tertiary} mb-4`}>
            No strategies configured
          </div>
          <button
            type="button"
            onClick={addStrategy}
            className={`px-4 py-2 text-button ${colors.bg.brand} ${colors.text.brandContrast} rounded-sm hover:opacity-90 transition-opacity`}
          >
            Add Your First Strategy
          </button>
        </div>
      )}
    </div>
  );
}