import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form@7.55.0';
import { zodResolver } from '@hookform/resolvers/zod';
import { useThemeStore } from '../../stores/themeStore';
import { useAppStore } from '../../stores/appStore';
import { useTradesStore } from '../../stores/tradesStore';
import { useMarketDataStore } from '../../stores/marketDataStore';
import type { ActiveMarketMakerStrategy } from '../../stores/appStore';
import { ExchangePairSelector } from '../ExchangePairSelector';

// Import tab components
import { AdvancedTab } from './AdvancedTab';
import { AutomatedTab } from './AutomatedTab';
import { MultiOrderTab } from './MultiOrderTab';
import { ExchangePointsTab } from './ExchangePointsTab';
import { EnterpriseTab } from './EnterpriseTab';

// Import types and schemas
import {
  MarketMakerFormData,
  VaultFormData,
  MultiOrderFormData,
  EnterpriseFormData,
  marketMakerFormSchema,
  vaultFormSchema,
  multiOrderFormSchema,
  enterpriseFormSchema,
} from './types';

interface MarketMakerPageProps {
  enabledExchanges?: string[];
  onCreateOrder?: (orderRequest: any) => void;
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
  onOpenTransfer?: () => void;
  onNavigateToStrategy?: (strategyId: string) => void;
}

type TabType = 'advanced' | 'automated' | 'multiOrder' | 'exchangePoints' | 'enterprise';

export default function MarketMakerPage({
  enabledExchanges = [],
  onNavigateToStrategy,
}: MarketMakerPageProps) {
  const { colors } = useThemeStore();
  const deployMarketMakerStrategies = useAppStore((s) => s.deployMarketMakerStrategies);
  const { addTrade, addOrder } = useTradesStore();
  const { exchanges, assets } = useMarketDataStore();

  // Get exchanges and pairs from centralized store
  const EXCHANGES = exchanges.map(ex => ex.name);
  const PAIRS = Array.from(assets.values()).map(asset => asset.symbol + '/USDC');

  const [activeTab, setActiveTab] = useState<TabType>('advanced');
  const [showExchangePairSelector, setShowExchangePairSelector] = useState(false);
  const [isEnterpriseAuthenticated, setIsEnterpriseAuthenticated] = useState(false);

  // React Hook Form instances for each tab
  const advancedForm = useForm<MarketMakerFormData>({
    resolver: zodResolver(marketMakerFormSchema),
    defaultValues: {
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
    },
  });

  const vaultForm = useForm<VaultFormData>({
    resolver: zodResolver(vaultFormSchema),
    defaultValues: {
      selectedVault: null,
      deployCapital: '',
      leverage: '1',
      slippageTolerance: '0.5',
      maxDrawdown: '5',
    },
  });

  const multiOrderForm = useForm<MultiOrderFormData>({
    resolver: zodResolver(multiOrderFormSchema),
    defaultValues: {
      strategies: [
        {
          id: '1',
          name: 'Strategy 1',
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
        },
      ],
    },
  });

  const multiOrderFieldArray = useFieldArray({
    control: multiOrderForm.control,
    name: 'strategies',
  });

  const enterpriseForm = useForm<EnterpriseFormData>({
    resolver: zodResolver(enterpriseFormSchema),
    defaultValues: {
      enterpriseCode: '',
      selectedFeature: null,
      selectedExchanges: [],
      selectedPairs: [],
      apiKey: '',
      executionSpeed: 'moderate',
      maxPositionSize: '100000',
      riskLimit: '5',
    },
  });

  // Handlers
  const handleAdvancedSubmit = (data: MarketMakerFormData) => {
    const strategy: ActiveMarketMakerStrategy = {
      id: `mm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${data.exchange} ${data.pair}`,
      exchange: data.exchange,
      pair: data.pair,
      margin: parseFloat(data.margin),
      leverage: parseFloat(data.leverage),
      spreadBps: parseFloat(data.spreadBps),
      orderLevels: parseFloat(data.orderLevels),
      orderAmount: parseFloat(data.orderAmount),
      refreshTime: parseFloat(data.refreshTime),
      inventorySkew: parseFloat(data.inventorySkew),
      minSpread: parseFloat(data.minSpread),
      maxSpread: parseFloat(data.maxSpread),
      stopLoss: parseFloat(data.stopLoss),
      takeProfit: parseFloat(data.takeProfit),
      participationRate: data.participationRate,
      enableAutoRepeat: data.enableAutoRepeat,
      maxRuns: parseFloat(data.maxRuns),
      enablePnlTolerance: data.enablePnlTolerance,
      tolerancePercent: parseFloat(data.tolerancePercent),
      status: 'running',
      startTime: Date.now(),
      currentPnl: 0,
      currentRoi: 0,
      volume: 0,
      exposure: parseFloat(data.margin) * parseFloat(data.leverage),
      runsCompleted: 0,
    };

    deployMarketMakerStrategies([strategy]);
    addStrategyToTrades(strategy);

    if (onNavigateToStrategy) {
      onNavigateToStrategy(strategy.id);
    }
  };

  const handleVaultDeploy = (data: VaultFormData) => {
    console.log('Deploying to vault:', data);
    // Implementation for vault deployment
  };

  const handleMultiOrderSimulate = () => {
    console.log('Simulating multi-order strategies');
    // Implementation for simulation
  };

  const handleMultiOrderDeploy = () => {
    const strategies = multiOrderForm.getValues('strategies');
    const validStrategies = strategies.filter(s => s.exchange && s.pair && s.margin);

    const activeStrategies: ActiveMarketMakerStrategy[] = validStrategies.map(strategy => ({
      id: `mm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: strategy.name,
      exchange: strategy.exchange,
      pair: strategy.pair,
      margin: parseFloat(strategy.margin),
      leverage: parseFloat(strategy.leverage),
      spreadBps: parseFloat(strategy.spreadBps),
      orderLevels: parseFloat(strategy.orderLevels),
      orderAmount: parseFloat(strategy.orderAmount),
      refreshTime: parseFloat(strategy.refreshTime),
      inventorySkew: parseFloat(strategy.inventorySkew),
      minSpread: parseFloat(strategy.minSpread),
      maxSpread: parseFloat(strategy.maxSpread),
      stopLoss: parseFloat(strategy.stopLoss),
      takeProfit: parseFloat(strategy.takeProfit),
      participationRate: strategy.participationRate,
      enableAutoRepeat: strategy.enableAutoRepeat,
      maxRuns: parseFloat(strategy.maxRuns),
      enablePnlTolerance: strategy.enablePnlTolerance,
      tolerancePercent: parseFloat(strategy.tolerancePercent),
      status: 'running',
      startTime: Date.now(),
      currentPnl: 0,
      currentRoi: 0,
      volume: 0,
      exposure: parseFloat(strategy.margin) * parseFloat(strategy.leverage),
      runsCompleted: 0,
    }));

    deployMarketMakerStrategies(activeStrategies);
    activeStrategies.forEach(addStrategyToTrades);

    if (activeStrategies.length > 0 && onNavigateToStrategy) {
      onNavigateToStrategy(activeStrategies[0].id);
    }
  };

  const handleEnterpriseAuthenticate = () => {
    const code = enterpriseForm.getValues('enterpriseCode');
    if (code === '1234') {
      setIsEnterpriseAuthenticated(true);
    }
  };

  const handleEnterpriseDeploy = () => {
    console.log('Deploying enterprise strategy');
    // Implementation for enterprise deployment
  };

  const addStrategyToTrades = (strategy: ActiveMarketMakerStrategy) => {
    const token = strategy.pair.split('/')[0] || 'BTC';
    const price = 89128; // Mock price
    const tokenSize = strategy.orderAmount / price;

    addOrder({
      type: 'long',
      exchange: strategy.exchange,
      token: token,
      size: tokenSize,
      price: price,
      status: 'pending',
      source: 'market-maker',
    });

    const strategyVolume = strategy.margin * strategy.leverage * 20;

    addTrade({
      type: 'long',
      exchange: strategy.exchange,
      token: token,
      size: tokenSize,
      entryPrice: price,
      source: 'market-maker',
      leverage: strategy.leverage,
      volume: strategyVolume,
    });
  };

  const handleExchangePairSelect = (exchange: string, pair: string) => {
    if (activeTab === 'advanced') {
      advancedForm.setValue('exchange', exchange);
      advancedForm.setValue('pair', pair);
    }
    setShowExchangePairSelector(false);
  };

  return (
    <div className="h-[calc(100vh-3rem-1px)] overflow-y-auto">
      <div className="max-w-[1600px] mx-auto px-6 py-3">
        {/* Header */}
        <div className="mb-3">
          <h1 className="text-header font-semibold tracking-tight">Market Maker</h1>
          <p className={`text-label ${colors.text.tertiary} mt-0.5`}>
            Configure and deploy automated market making strategies
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-4">
          <div className={`flex gap-1 border-b ${colors.border.secondary}`}>
            {[
              { id: 'advanced', label: 'Advanced' },
              { id: 'automated', label: 'Automated Vaults' },
              { id: 'multiOrder', label: 'Multi-Strategy' },
              { id: 'exchangePoints', label: 'Exchange Points' },
              { id: 'enterprise', label: 'Enterprise' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-4 py-2 text-button font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? colors.text.primary
                    : `${colors.text.tertiary} hover:${colors.text.secondary}`
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-0.5 ${colors.bg.brand}`}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'advanced' && (
            <form onSubmit={advancedForm.handleSubmit(handleAdvancedSubmit)}>
              <AdvancedTab
                form={advancedForm}
                onShowExchangePairSelector={() => setShowExchangePairSelector(true)}
              />
            </form>
          )}

          {activeTab === 'automated' && (
            <AutomatedTab
              form={vaultForm}
              onDeploy={handleVaultDeploy}
            />
          )}

          {activeTab === 'multiOrder' && (
            <MultiOrderTab
              control={multiOrderForm.control}
              fieldArray={multiOrderFieldArray}
              exchanges={EXCHANGES}
              pairs={PAIRS}
              onDeploy={handleMultiOrderDeploy}
              onSimulate={handleMultiOrderSimulate}
            />
          )}

          {activeTab === 'exchangePoints' && <ExchangePointsTab />}

          {activeTab === 'enterprise' && (
            <EnterpriseTab
              form={enterpriseForm}
              exchanges={EXCHANGES}
              pairs={PAIRS}
              isAuthenticated={isEnterpriseAuthenticated}
              onAuthenticate={handleEnterpriseAuthenticate}
              onDeploy={handleEnterpriseDeploy}
            />
          )}
        </div>
      </div>

      {/* Exchange Pair Selector Modal */}
      {showExchangePairSelector && (
        <ExchangePairSelector
          enabledExchanges={enabledExchanges}
          onSelect={handleExchangePairSelect}
          onClose={() => setShowExchangePairSelector(false)}
        />
      )}
    </div>
  );
}