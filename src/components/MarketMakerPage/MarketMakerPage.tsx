import { useState, useEffect, useRef } from 'react';
import { useThemeStore } from '../../stores/themeStore';
import { useNavigation } from '../../hooks/useNavigation';
import { useAppStore } from '../../stores/appStore';
import { useTradesStore } from '../../stores/tradesStore';
import { useMarketDataStore } from '../../stores/marketDataStore';
import type { ActiveMarketMakerStrategy } from '../../stores/appStore';
import { ChevronDown, Info, Plus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { ExchangePairSelector } from '../ExchangePairSelector';

interface MarketMakerPageProps {
  enabledExchanges?: string[];
  onCreateOrder?: (orderRequest: any) => void;
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
  onOpenTransfer?: () => void;
  onNavigateToStrategy?: (strategyId: string) => void;
}

// Exchanges and Pairs will come from centralized market data store

const TOOLTIPS: Record<string, string> = {
  baseSpread: 'The minimum price difference between buy and sell orders',
  orderLevels: 'Number of price levels on each side of the order book',
  orderAmount: 'Size of each individual order in USDC',
  refreshTime: 'How frequently to update orders based on market conditions',
  inventorySkew: 'Adjusts order sizes to rebalance inventory - negative favors selling, positive favors buying',
  minSpread: 'Minimum allowed spread during volatile conditions',
  maxSpread: 'Maximum allowed spread during low volatility',
  stopLoss: 'Maximum loss percentage before strategy stops',
  takeProfit: 'Target profit percentage to lock in gains',
  participationRate: 'How frequently the bot participates in market making - Aggressive (5 min), Neutral (15 min), Passive (30-60 min avg)',
  autoRepeat: 'Automatically restart the bot after it completes a run',
  maxRuns: 'Maximum number of times to run the bot automatically',
  pnlTolerance: 'If enabled, bot will only repeat if ending PNL is within the specified tolerance range',
  tolerancePercent: 'PNL tolerance range (±) - bot repeats only if ending equity change is within this percentage',
};

interface Vault {
  id: string;
  name: string;
  pnl: number;
  volume: number;
  tvl: number;
  apy: number;
}

const VAULTS: Vault[] = [
  { id: 'velar', name: 'Velar', pnl: 12.4, volume: 245000000, tvl: 8500000, apy: 18.2 },
  { id: 'wintermute', name: 'Wintermute', pnl: 8.7, volume: 520000000, tvl: 12000000, apy: 14.5 },
  { id: 'jump', name: 'Jump Trading', pnl: 15.2, volume: 380000000, tvl: 9200000, apy: 22.1 },
  { id: 'gsr', name: 'GSR', pnl: 6.3, volume: 190000000, tvl: 5500000, apy: 11.8 },
  { id: 'cumberland', name: 'Cumberland', pnl: 4.1, volume: 850000000, tvl: 18000000, apy: 8.5 },
  { id: 'b2c2', name: 'B2C2', pnl: 22.8, volume: 120000000, tvl: 3800000, apy: 28.4 },
];

interface ExchangePoints {
  name: string;
  supportsPoints: boolean;
  pointsEarned: number | null;
  status?: 'active' | 'concluded';
}

const EXCHANGE_POINTS: ExchangePoints[] = [
  { name: 'Hyperliquid', supportsPoints: true, pointsEarned: 12450, status: 'active' },
  { name: 'Paradex', supportsPoints: true, pointsEarned: 8320, status: 'active' },
  { name: 'Aster', supportsPoints: true, pointsEarned: 6890, status: 'active' },
  { name: 'Binance', supportsPoints: true, pointsEarned: 25680, status: 'concluded' },
  { name: 'Bybit', supportsPoints: true, pointsEarned: 15240, status: 'active' },
  { name: 'OKX', supportsPoints: false, pointsEarned: null },
];

export default function MarketMakerPage({
  enabledExchanges = [],
  onNavigateToStrategy,
}: MarketMakerPageProps) {
  const { colors } = useThemeStore();
  const { navigateTo } = useNavigation();
  const deployMarketMakerStrategies = useAppStore((s) => s.deployMarketMakerStrategies);
  const { addTrade, addOrder, addHistoryEntry } = useTradesStore();
  const { exchanges, assets, getAsset } = useMarketDataStore();
  
  // Get exchanges and pairs from centralized store
  const EXCHANGES = exchanges.map(ex => ex.name);
  const PAIRS = Array.from(assets.values()).map(asset => 
    asset.symbol + '/USDC'
  );
  
  const [activeTab, setActiveTab] = useState<'advanced' | 'automated' | 'multiOrder' | 'exchangePoints' | 'enterprise'>('advanced');
  const [showExchangeDropdown, setShowExchangeDropdown] = useState(false);
  const [showPairDropdown, setShowPairDropdown] = useState(false);
  const [showExchangePairSelector, setShowExchangePairSelector] = useState(false);
  const [editingStrategyId, setEditingStrategyId] = useState<string | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  
  const exchangeRef = useRef<HTMLDivElement>(null);
  const pairRef = useRef<HTMLDivElement>(null);
  
  // Automated vault selection
  const [selectedVault, setSelectedVault] = useState<string | null>(null);
  const [deployCapital, setDeployCapital] = useState('');
  const [vaultLeverage, setVaultLeverage] = useState('1');
  const [slippageTolerance, setSlippageTolerance] = useState('0.5');
  const [maxDrawdown, setMaxDrawdown] = useState('5');
  
  const [selectedExchange, setSelectedExchange] = useState('');
  const [selectedPair, setSelectedPair] = useState('');
  const [margin, setMargin] = useState('');
  const [leverage, setLeverage] = useState('1');
  const [volume, setVolume] = useState('0');
  
  // Market making parameters
  const [spreadBps, setSpreadBps] = useState('10');
  const [orderLevels, setOrderLevels] = useState('5');
  const [orderAmount, setOrderAmount] = useState('100');
  const [refreshTime, setRefreshTime] = useState('5');
  const [inventorySkew, setInventorySkew] = useState('0');
  const [minSpread, setMinSpread] = useState('5');
  const [maxSpread, setMaxSpread] = useState('50');
  const [stopLoss, setStopLoss] = useState('2');
  const [takeProfit, setTakeProfit] = useState('5');
  
  // Auto-repeat settings
  const [enableAutoRepeat, setEnableAutoRepeat] = useState(false);
  const [maxRuns, setMaxRuns] = useState('3');
  const [enablePnlTolerance, setEnablePnlTolerance] = useState(false);
  const [tolerancePercent, setTolerancePercent] = useState('2');
  
  // Participation rate
  const [participationRate, setParticipationRate] = useState<'passive' | 'neutral' | 'aggressive'>('neutral');
  
  // Enterprise access
  const [enterpriseCode, setEnterpriseCode] = useState('');
  const [isEnterpriseAuthenticated, setIsEnterpriseAuthenticated] = useState(false);
  
  // Enterprise strategy configuration
  const [selectedEnterpriseFeature, setSelectedEnterpriseFeature] = useState<string | null>(null);
  const [selectedEnterpriseExchanges, setSelectedEnterpriseExchanges] = useState<string[]>([]);
  const [selectedEnterprisePairs, setSelectedEnterprisePairs] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [executionSpeed, setExecutionSpeed] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  const [maxPositionSize, setMaxPositionSize] = useState('100000');
  const [riskLimit, setRiskLimit] = useState('5');
  const [isStrategyActive, setIsStrategyActive] = useState(false);
  
  // JSON Strategy Upload
  const [uploadedStrategyFile, setUploadedStrategyFile] = useState<File | null>(null);
  const [uploadedStrategyData, setUploadedStrategyData] = useState<any>(null);
  const [strategyUploadError, setStrategyUploadError] = useState<string>('');
  const [isStrategyDeployed, setIsStrategyDeployed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Multi-Strategy state
  interface Strategy {
    id: string;
    name: string;
    exchange: string;
    pair: string;
    margin: string;
    leverage: string;
    spreadBps: string;
    orderLevels: string;
    orderAmount: string;
    refreshTime: string;
    inventorySkew: string;
    minSpread: string;
    maxSpread: string;
    stopLoss: string;
    takeProfit: string;
    participationRate: 'passive' | 'neutral' | 'aggressive';
    enableAutoRepeat: boolean;
    maxRuns: string;
    enablePnlTolerance: boolean;
    tolerancePercent: string;
    expanded: boolean;
    submitted: boolean;
  }
  
  const [strategies, setStrategies] = useState<Strategy[]>([
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
      submitted: false
    }
  ]);
  
  // Strategy JSON upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingStrategyId, setUploadingStrategyId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  // Simulation modal
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  
  // Deploy confirmation modal
  const [showDeployConfirmation, setShowDeployConfirmation] = useState(false);
  const [expandedStrategies, setExpandedStrategies] = useState<Set<string>>(new Set());
  
  const toggleStrategyExpansion = (strategyId: string) => {
    setExpandedStrategies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(strategyId)) {
        newSet.delete(strategyId);
      } else {
        newSet.add(strategyId);
      }
      return newSet;
    });
  };
  
  const calculateStrategyEstimates = (strategy: Strategy) => {
    const marginNum = parseFloat(strategy.margin) || 0;
    const leverageNum = parseFloat(strategy.leverage) || 1;
    const spreadBpsNum = parseFloat(strategy.spreadBps) || 0;
    const maxRunsNum = parseFloat(strategy.maxRuns) || 1;
    
    // Volume per run
    const volumePerRun = marginNum * leverageNum * 20;
    
    // Calculate how many runs can fit in 24 hours based on participation rate
    const timePerRunMinutes = {
      aggressive: 5,
      neutral: 15,
      passive: 45,
    }[strategy.participationRate];
    
    const maxPossibleRunsPerDay = Math.floor((24 * 60) / timePerRunMinutes);
    
    // Actual runs per day
    let actualRunsPerDay = 1;
    if (strategy.enableAutoRepeat) {
      actualRunsPerDay = Math.min(maxPossibleRunsPerDay, maxRunsNum);
    }
    
    // Daily volume
    const dailyVolume = volumePerRun * actualRunsPerDay;
    
    // Maker fee rebate (typical: -0.01% = -0.0001)
    const makerFeeRate = -0.0001;
    const makerFees = dailyVolume * Math.abs(makerFeeRate);
    
    // Spread capture (capture ~50% of spread on average)
    const spreadCaptureRate = (spreadBpsNum / 10000) / 2;
    const spreadProfit = dailyVolume * spreadCaptureRate;
    
    // Total daily return
    const dailyReturn = spreadProfit + makerFees;
    const dailyReturnPercent = (dailyReturn / marginNum) * 100;
    
    // Monthly projection
    const monthlyReturn = dailyReturn * 30;
    const monthlyReturnPercent = (monthlyReturn / marginNum) * 100;
    
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
  
  // File upload handler for importing strategy configurations
  const processStrategyJsonFile = (strategyId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonContent = JSON.parse(e.target?.result as string);
        
        // Update the strategy with the imported configuration
        setStrategies(strategies.map(s => {
          if (s.id === strategyId) {
            return {
              ...s,
              name: jsonContent.STRATEGYNAME || jsonContent.name || s.name,
              exchange: jsonContent.exchange || s.exchange,
              pair: jsonContent.pair || s.pair,
              margin: jsonContent.PARAMETERS?.MAXPOSITIONSIZE?.toString() || jsonContent.margin?.toString() || s.margin,
              leverage: jsonContent.leverage?.toString() || s.leverage,
              spreadBps: jsonContent.PARAMETERS?.MINSPREAD?.toString() || jsonContent.spreadBps?.toString() || s.spreadBps,
              orderLevels: jsonContent.PARAMETERS?.ORDERSIZE?.toString() || jsonContent.orderLevels?.toString() || s.orderLevels,
              orderAmount: jsonContent.orderAmount?.toString() || s.orderAmount,
              refreshTime: jsonContent.PARAMETERS?.REBALANCEINTERVAL?.toString() || jsonContent.refreshTime?.toString() || s.refreshTime,
              inventorySkew: jsonContent.inventorySkew?.toString() || s.inventorySkew,
              minSpread: jsonContent.PARAMETERS?.MINSPREAD?.toString() || jsonContent.minSpread?.toString() || s.minSpread,
              maxSpread: jsonContent.maxSpread?.toString() || s.maxSpread,
              stopLoss: jsonContent.PARAMETERS?.RISKLIMIT?.toString() || jsonContent.stopLoss?.toString() || s.stopLoss,
              takeProfit: jsonContent.takeProfit?.toString() || s.takeProfit,
              participationRate: jsonContent.participationRate || s.participationRate,
              enableAutoRepeat: jsonContent.enableAutoRepeat ?? s.enableAutoRepeat,
              maxRuns: jsonContent.maxRuns?.toString() || s.maxRuns,
              enablePnlTolerance: jsonContent.enablePnlTolerance ?? s.enablePnlTolerance,
              tolerancePercent: jsonContent.tolerancePercent?.toString() || s.tolerancePercent,
            };
          }
          return s;
        }));

        // Close modal and reset
        setShowUploadModal(false);
        setUploadingStrategyId(null);
      } catch (error) {
        console.error('Failed to parse JSON file:', error);
        alert('Failed to parse JSON file. Please ensure it is valid JSON format.');
      }
    };
    reader.readAsText(file);
  };
  
  const handleStrategyJsonUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !uploadingStrategyId) return;
    
    processStrategyJsonFile(uploadingStrategyId, file);
    event.target.value = '';
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file || !uploadingStrategyId) return;
    
    if (file.type === 'application/json' || file.name.endsWith('.json')) {
      processStrategyJsonFile(uploadingStrategyId, file);
    } else {
      alert('Please upload a valid JSON file.');
    }
  };
  
  // Strategy validation and submit function
  const validateAndSubmitStrategy = (strategyId: string) => {
    const strategy = strategies.find(s => s.id === strategyId);
    if (!strategy) return;

    // Validate required fields
    const errors: string[] = [];
    if (!strategy.exchange) errors.push('Exchange');
    if (!strategy.pair) errors.push('Trading Pair');
    if (!strategy.margin || parseFloat(strategy.margin) <= 0) errors.push('Margin');
    if (!strategy.leverage || parseFloat(strategy.leverage) <= 0) errors.push('Leverage');

    if (errors.length > 0) {
      alert(`Please fill in the following required fields:\n- ${errors.join('\n- ')}`);
      return;
    }

    // Mark strategy as submitted and collapse it
    setStrategies(strategies.map(s =>
      s.id === strategyId
        ? { ...s, submitted: true, expanded: false }
        : s
    ));
  };

  // Simulation calculation function
  const runSimulation = () => {
    // Calculate simulation results based on configured strategies
    const exchangeExposure: { [key: string]: number } = {};
    const exchangePnL: { [key: string]: number } = {};
    const strategyResults: any[] = [];
    
    let totalExposure = 0;
    let totalPnL = 0;
    
    strategies.forEach((strategy, index) => {
      if (!strategy.exchange || !strategy.pair || !strategy.margin) return;
      
      const margin = parseFloat(strategy.margin) || 0;
      const leverage = parseFloat(strategy.leverage) || 1;
      const spreadBps = parseFloat(strategy.spreadBps) || 10;
      const exposure = margin * leverage;
      
      // Mock PnL calculation based on spread and market conditions
      const basePnL = (spreadBps / 10000) * exposure * 0.8; // 80% capture rate
      const variance = (Math.random() - 0.5) * 0.3; // ±15% variance
      const strategyPnL = basePnL * (1 + variance);
      
      // Accumulate per exchange
      if (!exchangeExposure[strategy.exchange]) {
        exchangeExposure[strategy.exchange] = 0;
        exchangePnL[strategy.exchange] = 0;
      }
      exchangeExposure[strategy.exchange] += exposure;
      exchangePnL[strategy.exchange] += strategyPnL;
      
      totalExposure += exposure;
      totalPnL += strategyPnL;
      
      strategyResults.push({
        name: strategy.name,
        exchange: strategy.exchange,
        pair: strategy.pair,
        exposure,
        pnl: strategyPnL,
        pnlPercent: (strategyPnL / margin) * 100,
        roi: (strategyPnL / margin) * 100
      });
    });
    
    // Calculate correlations and interactions
    const correlations: { [key: string]: number } = {};
    const pairsByExchange: { [key: string]: string[] } = {};
    
    strategies.forEach(s => {
      if (!s.exchange || !s.pair) return;
      if (!pairsByExchange[s.exchange]) pairsByExchange[s.exchange] = [];
      if (!pairsByExchange[s.exchange].includes(s.pair)) {
        pairsByExchange[s.exchange].push(s.pair);
      }
    });
    
    // Mock correlation calculations
    Object.keys(pairsByExchange).forEach(exchange => {
      const pairs = pairsByExchange[exchange];
      if (pairs.length > 1) {
        correlations[exchange] = 0.3 + Math.random() * 0.4; // 0.3-0.7 correlation
      }
    });
    
    setSimulationResults({
      totalPnL,
      totalExposure,
      overallRoi: (totalPnL / (totalExposure / strategies.reduce((acc, s) => acc + (parseFloat(s.leverage) || 1), 0) * strategies.length)) * 100,
      strategyResults,
      exchangeExposure,
      exchangePnL,
      correlations,
      riskMetrics: {
        maxDrawdown: -2.5 - Math.random() * 2,
        sharpeRatio: 1.5 + Math.random() * 1,
        diversificationBenefit: Object.keys(correlations).length > 0 ? 12 + Math.random() * 8 : 0
      }
    });
    
    setShowSimulationModal(true);
  };
  
  // Vault creation
  const [showVaultCreationModal, setShowVaultCreationModal] = useState(false);
  const [vaultCreationStep, setVaultCreationStep] = useState<'name' | 'deposit' | 'confirm' | 'success'>('name');
  const [newVaultName, setNewVaultName] = useState('');
  const [vaultDepositAmount, setVaultDepositAmount] = useState('100');
  const [isCreatingVault, setIsCreatingVault] = useState(false);
  const [vaultPrivacy, setVaultPrivacy] = useState<'public' | 'private'>('public');
  
  // Vault management (mock data for created vault)
  const [creatorDeposit, setCreatorDeposit] = useState(5000); // Creator's deposit
  const [userDeposits, setUserDeposits] = useState(95000); // Total user deposits
  const [accumulatedProfits, setAccumulatedProfits] = useState(2450); // 10% of total profits
  const [vaultPnl, setVaultPnl] = useState(8.5); // Vault performance %
  const [managementDepositAmount, setManagementDepositAmount] = useState('');
  const [managementWithdrawAmount, setManagementWithdrawAmount] = useState('');
  const [takeProfitAmount, setTakeProfitAmount] = useState('');
  const [currentVaultPrivacy, setCurrentVaultPrivacy] = useState<'public' | 'private'>('public');
  
  const generateApiKey = () => {
    const key = 'ent_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setApiKey(key);
  };
  
  const toggleEnterpriseExchange = (exchange: string) => {
    setSelectedEnterpriseExchanges(prev => 
      prev.includes(exchange) 
        ? prev.filter(e => e !== exchange)
        : [...prev, exchange]
    );
  };
  
  const toggleEnterprisePair = (pair: string) => {
    setSelectedEnterprisePairs(prev => 
      prev.includes(pair) 
        ? prev.filter(p => p !== pair)
        : [...prev, pair]
    );
  };
  
  const handleEnterpriseSubmit = () => {
    if (enterpriseCode === '1234') {
      setIsEnterpriseAuthenticated(true);
    }
  };
  
  const handleStrategyFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (file.type !== 'application/json') {
      setStrategyUploadError('Please upload a valid JSON file');
      setUploadedStrategyFile(null);
      setUploadedStrategyData(null);
      return;
    }
    
    // Read and parse JSON
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        
        // Basic validation - check for required fields
        if (!jsonData.strategyName || !jsonData.parameters) {
          setStrategyUploadError('Invalid strategy format. Must include strategyName and parameters');
          setUploadedStrategyFile(null);
          setUploadedStrategyData(null);
          return;
        }
        
        setUploadedStrategyFile(file);
        setUploadedStrategyData(jsonData);
        setStrategyUploadError('');
        setIsStrategyDeployed(false);
      } catch (error) {
        setStrategyUploadError('Failed to parse JSON file. Please check the format.');
        setUploadedStrategyFile(null);
        setUploadedStrategyData(null);
      }
    };
    
    reader.onerror = () => {
      setStrategyUploadError('Failed to read file');
      setUploadedStrategyFile(null);
      setUploadedStrategyData(null);
    };
    
    reader.readAsText(file);
  };
  
  const handleDeployStrategy = () => {
    if (!uploadedStrategyData) return;
    setIsStrategyDeployed(true);
    // In production, this would send the strategy to the backend
    console.log('Deploying strategy:', uploadedStrategyData);
  };
  
  const handleClearStrategy = () => {
    setUploadedStrategyFile(null);
    setUploadedStrategyData(null);
    setStrategyUploadError('');
    setIsStrategyDeployed(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleCreateVault = async () => {
    setIsCreatingVault(true);
    // Simulate vault creation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsCreatingVault(false);
    setVaultCreationStep('success');
  };
  
  const resetVaultCreation = () => {
    setShowVaultCreationModal(false);
    setVaultCreationStep('name');
    setNewVaultName('');
    setVaultDepositAmount('100');
    setIsCreatingVault(false);
    setVaultPrivacy('public');
  };
  
  const handleVaultDeposit = () => {
    const amount = parseFloat(managementDepositAmount);
    if (amount > 0) {
      setCreatorDeposit(prev => prev + amount);
      setManagementDepositAmount('');
    }
  };
  
  const handleVaultWithdraw = () => {
    const amount = parseFloat(managementWithdrawAmount);
    const totalTvl = creatorDeposit + userDeposits;
    const minRequired = totalTvl * 0.05; // 5% minimum
    
    if (amount > 0 && (creatorDeposit - amount) >= minRequired) {
      setCreatorDeposit(prev => prev - amount);
      setManagementWithdrawAmount('');
    }
  };
  
  const handleTakeProfit = () => {
    const amount = parseFloat(takeProfitAmount);
    if (amount > 0 && amount <= accumulatedProfits) {
      setAccumulatedProfits(prev => prev - amount);
      setTakeProfitAmount('');
    }
  };
  
  const handleDeployAllStrategies = () => {
    // Open confirmation modal
    setShowDeployConfirmation(true);
  };
  
  const confirmDeployAllStrategies = () => {
    // Convert strategies to ActiveMarketMakerStrategy format
    const validStrategies = strategies.filter(s => s.exchange && s.pair && s.margin);
    
    const activeStrategies: ActiveMarketMakerStrategy[] = validStrategies.map(strategy => ({
      id: `mm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: strategy.name,
      exchange: strategy.exchange,
      pair: strategy.pair,
      margin: parseFloat(strategy.margin) || 0,
      leverage: parseFloat(strategy.leverage) || 1,
      spreadBps: parseFloat(strategy.spreadBps) || 0,
      orderLevels: parseFloat(strategy.orderLevels) || 0,
      orderAmount: parseFloat(strategy.orderAmount) || 0,
      refreshTime: parseFloat(strategy.refreshTime) || 0,
      inventorySkew: parseFloat(strategy.inventorySkew) || 0,
      minSpread: parseFloat(strategy.minSpread) || 0,
      maxSpread: parseFloat(strategy.maxSpread) || 0,
      stopLoss: parseFloat(strategy.stopLoss) || 0,
      takeProfit: parseFloat(strategy.takeProfit) || 0,
      participationRate: strategy.participationRate,
      enableAutoRepeat: strategy.enableAutoRepeat,
      maxRuns: parseFloat(strategy.maxRuns) || 1,
      enablePnlTolerance: strategy.enablePnlTolerance,
      tolerancePercent: parseFloat(strategy.tolerancePercent) || 0,
      status: 'running',
      startTime: Date.now(),
      currentPnl: 0,
      currentRoi: 0,
      volume: 0,
      exposure: (parseFloat(strategy.margin) || 0) * (parseFloat(strategy.leverage) || 1),
      runsCompleted: 0,
    }));

    // Deploy strategies to global state
    deployMarketMakerStrategies(activeStrategies);
    
    // Add to global trades store
    activeStrategies.forEach(strategy => {
      const token = strategy.pair.split('-')[0] || 'BTC';
      const price = 89128; // Mock BTC price
      const orderAmountUSDC = strategy.orderAmount || 100;
      const tokenSize = orderAmountUSDC / price; // Convert USDC to token amount
      
      // Add order to global trades store
      addOrder({
        type: 'long',
        exchange: strategy.exchange,
        token: token,
        size: tokenSize, // Token size (e.g., 0.00112 BTC)
        price: price, // Price per token (e.g., 89128 USD)
        status: 'pending',
        source: 'market-maker',
      });
      
      // Calculate volume for this strategy: margin × leverage × 20
      const strategyVolume = strategy.margin * strategy.leverage * 20;
      
      addTrade({
        type: 'long', // Market maker strategies can be considered long positions
        exchange: strategy.exchange,
        token: token,
        size: tokenSize,
        entryPrice: price,
        source: 'market-maker',
        leverage: strategy.leverage,
        volume: strategyVolume, // Explicit volume: margin × leverage × 20
      });
    });
    
    console.log('Deployed strategies:', activeStrategies);
    setShowDeployConfirmation(false);
    
    // Navigate to the first strategy's monitor page
    if (activeStrategies.length > 0 && onNavigateToStrategy) {
      onNavigateToStrategy(activeStrategies[0].id);
    }
    
    // In production, this would also send the strategies to the backend
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exchangeRef.current && !exchangeRef.current.contains(event.target as Node)) {
        setShowExchangeDropdown(false);
      }
      if (pairRef.current && !pairRef.current.contains(event.target as Node)) {
        setShowPairDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate volume when margin or leverage changes
  useEffect(() => {
    const marginNum = parseFloat(margin) || 0;
    const leverageNum = parseFloat(leverage) || 1;
    // Volume calculation: margin × leverage × 20
    // Examples: $50 × 50x × 20 = $50,000 | $10 × 50x × 20 = $10,000
    const calculatedVolume = marginNum * leverageNum * 20;
    setVolume(calculatedVolume.toFixed(2));
  }, [margin, leverage]);

  // Calculate estimated performance metrics
  const calculateEstimates = () => {
    const volumeNum = parseFloat(volume) || 0;
    const spreadBpsNum = parseFloat(spreadBps) || 0;
    const maxRunsNum = parseFloat(maxRuns) || 1;
    
    // Calculate how many runs can fit in 24 hours based on participation rate
    const timePerRunMinutes = {
      aggressive: 5,    // 5 min per run
      neutral: 15,      // 15 min per run
      passive: 45,      // 45 min per run (average of 30-60)
    }[participationRate];
    
    const maxPossibleRunsPerDay = Math.floor((24 * 60) / timePerRunMinutes);
    
    // Actual runs per day (limited by max runs if auto-repeat is enabled)
    let actualRunsPerDay = 1; // Default: single run
    if (enableAutoRepeat) {
      // If auto-repeat enabled, use the smaller of: max possible runs or max runs setting
      actualRunsPerDay = Math.min(maxPossibleRunsPerDay, maxRunsNum);
    }
    
    // Daily volume estimate (volume per run × actual number of runs in 24h)
    const dailyVolume = volumeNum * actualRunsPerDay;
    
    // Maker fee rebate (typical: -0.01% = -0.0001)
    const makerFeeRate = -0.0001;
    const makerFees = dailyVolume * Math.abs(makerFeeRate);
    
    // Spread capture (capture ~50% of spread on average)
    const spreadCaptureRate = (spreadBpsNum / 10000) / 2;
    const spreadProfit = dailyVolume * spreadCaptureRate;
    
    // Total daily return (spread profit + maker rebates)
    const dailyReturn = spreadProfit + makerFees;
    
    return {
      dailyVolume,
      makerFees,
      dailyReturn,
    };
  };

  const estimates = calculateEstimates();

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
        <div className="mb-3">
          <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('advanced')}
              className={`px-4 py-2 text-button font-medium transition-colors relative ${
                activeTab === 'advanced'
                  ? `${colors.text.primary}`
                  : `${colors.text.tertiary} hover:${colors.text.secondary}`
              }`}
            >
              Advanced
              {activeTab === 'advanced' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A36A]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('automated')}
              className={`px-4 py-2 text-button font-medium transition-colors relative ${
                activeTab === 'automated'
                  ? `${colors.text.primary}`
                  : `${colors.text.tertiary} hover:${colors.text.secondary}`
              }`}
            >
              Market Maker Vaults
              {activeTab === 'automated' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A36A]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('multiOrder')}
              className={`px-4 py-2 text-button font-medium transition-colors relative ${
                activeTab === 'multiOrder'
                  ? `${colors.text.primary}`
                  : `${colors.text.tertiary} hover:${colors.text.secondary}`
              }`}
            >
              Multi-Strategy
              {activeTab === 'multiOrder' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A36A]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('exchangePoints')}
              className={`px-4 py-2 text-button font-medium transition-colors relative ${
                activeTab === 'exchangePoints'
                  ? `${colors.text.primary}`
                  : `${colors.text.tertiary} hover:${colors.text.secondary}`
              }`}
            >
              Exchange Points
              {activeTab === 'exchangePoints' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A36A]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('enterprise')}
              className={`px-4 py-2 text-button font-medium transition-colors relative ml-auto ${
                activeTab === 'enterprise'
                  ? `${colors.text.primary}`
                  : `${colors.text.tertiary} hover:${colors.text.secondary}`
              }`}
            >
              Enterprise
              {activeTab === 'enterprise' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A36A]" />
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'advanced' && (
        <div className="grid grid-cols-[1fr_360px] gap-3">
          {/* Left Column - Configuration */}
          <div className="space-y-3">
            {/* Basic Configuration */}
            <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-4`}>
              <h3 className="text-button font-medium mb-3">Basic Configuration</h3>
              
              {/* Exchange & Pair Selection */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div ref={exchangeRef} className="relative">
                  <label className={`text-label ${colors.text.secondary} block mb-1.5`}>
                    Exchange
                  </label>
                  <button
                    onClick={() => setShowExchangePairSelector(true)}
                    className={`w-full h-10 px-3 ${colors.bg.secondary} border ${colors.border.default} rounded flex items-center justify-between text-body ${selectedExchange ? colors.text.primary : colors.text.tertiary} hover:${colors.border.hover} transition-colors`}
                  >
                    {selectedExchange || 'Select Exchange'}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                <div ref={pairRef} className="relative">
                  <label className={`text-label ${colors.text.secondary} block mb-1.5`}>
                    Trading Pair
                  </label>
                  <button
                    onClick={() => setShowExchangePairSelector(true)}
                    className={`w-full h-10 px-3 ${colors.bg.secondary} border ${colors.border.default} rounded flex items-center justify-between text-body ${selectedPair ? colors.text.primary : colors.text.tertiary} hover:${colors.border.hover} transition-colors`}
                  >
                    {selectedPair || 'Select Pair'}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Margin, Leverage, Volume */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={`text-label ${colors.text.secondary} block mb-1.5`}>
                    Margin (USDC)
                  </label>
                  <div className={`h-10 px-3 ${colors.bg.secondary} border ${colors.border.default} rounded flex items-center`}>
                    <input
                      type="text"
                      value={margin}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          setMargin(value);
                        }
                      }}
                      placeholder="0.00"
                      className={`flex-1 bg-transparent text-numeric ${colors.text.primary} outline-none`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`text-label ${colors.text.secondary} block mb-1.5`}>
                    Leverage
                  </label>
                  <div className={`h-10 px-3 ${colors.bg.secondary} border ${colors.border.default} rounded flex items-center`}>
                    <input
                      type="text"
                      value={leverage}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          setLeverage(value);
                        }
                      }}
                      placeholder="1"
                      className={`flex-1 bg-transparent text-numeric ${colors.text.primary} outline-none`}
                    />
                    <span className={`text-label ${colors.text.tertiary} ml-2`}>x</span>
                  </div>
                </div>

                <div>
                  <label className={`text-label ${colors.text.secondary} block mb-1.5`}>
                    Volume (USDC)
                  </label>
                  <div className={`h-10 px-3 ${colors.bg.subtle} border ${colors.border.default} rounded flex items-center`}>
                    <span className={`text-numeric ${colors.text.primary}`}>
                      {parseFloat(volume).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Market Making Parameters */}
            <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-4`}>
              <h3 className="text-button font-medium mb-3">Market Making Parameters</h3>
              
              {/* Spread & Order Levels */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={`text-label ${colors.text.secondary} block mb-2 flex items-center gap-1`}>
                    Base Spread (bps)
                    <div className="relative inline-block">
                      <Info 
                        className="w-3.5 h-3.5 cursor-help" 
                        onMouseEnter={() => setActiveTooltip('baseSpread')}
                        onMouseLeave={() => setActiveTooltip(null)}
                      />
                      {activeTooltip === 'baseSpread' && (
                        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 ${colors.bg.surface} border ${colors.border.default} rounded shadow-lg text-label ${colors.text.secondary} z-20`}>
                          {TOOLTIPS.baseSpread}
                        </div>
                      )}
                    </div>
                  </label>
                  <div className={`h-10 px-3 ${colors.bg.secondary} border ${colors.border.default} rounded flex items-center`}>
                    <input
                      type="text"
                      value={spreadBps}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          setSpreadBps(value);
                        }
                      }}
                      placeholder="10"
                      className={`flex-1 bg-transparent text-numeric ${colors.text.primary} outline-none`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`text-label ${colors.text.secondary} block mb-1.5 flex items-center gap-1`}>
                    Order Levels
                    <div className="relative inline-block">
                      <Info 
                        className="w-3.5 h-3.5 cursor-help" 
                        onMouseEnter={() => setActiveTooltip('orderLevels')}
                        onMouseLeave={() => setActiveTooltip(null)}
                      />
                      {activeTooltip === 'orderLevels' && (
                        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 ${colors.bg.surface} border ${colors.border.default} rounded shadow-lg text-label ${colors.text.secondary} z-20`}>
                          {TOOLTIPS.orderLevels}
                        </div>
                      )}
                    </div>
                  </label>
                  <div className={`h-10 px-3 ${colors.bg.secondary} border ${colors.border.default} rounded flex items-center`}>
                    <input
                      type="text"
                      value={orderLevels}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d*$/.test(value)) {
                          setOrderLevels(value);
                        }
                      }}
                      placeholder="5"
                      className={`flex-1 bg-transparent text-numeric ${colors.text.primary} outline-none`}
                    />
                  </div>
                </div>
              </div>

              {/* Order Amount & Refresh Time */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={`text-label ${colors.text.secondary} block mb-2 flex items-center gap-1`}>
                    Order Amount (USDC)
                    <div className="relative inline-block">
                      <Info 
                        className="w-3.5 h-3.5 cursor-help" 
                        onMouseEnter={() => setActiveTooltip('orderAmount')}
                        onMouseLeave={() => setActiveTooltip(null)}
                      />
                      {activeTooltip === 'orderAmount' && (
                        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 ${colors.bg.surface} border ${colors.border.default} rounded shadow-lg text-label ${colors.text.secondary} z-20`}>
                          {TOOLTIPS.orderAmount}
                        </div>
                      )}
                    </div>
                  </label>
                  <div className={`h-10 px-3 ${colors.bg.secondary} border ${colors.border.default} rounded flex items-center`}>
                    <input
                      type="text"
                      value={orderAmount}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          setOrderAmount(value);
                        }
                      }}
                      placeholder="100"
                      className={`flex-1 bg-transparent text-numeric ${colors.text.primary} outline-none`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`text-label ${colors.text.secondary} block mb-2 flex items-center gap-1`}>
                    Refresh Time (seconds)
                    <div className="relative inline-block">
                      <Info 
                        className="w-3.5 h-3.5 cursor-help" 
                        onMouseEnter={() => setActiveTooltip('refreshTime')}
                        onMouseLeave={() => setActiveTooltip(null)}
                      />
                      {activeTooltip === 'refreshTime' && (
                        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 ${colors.bg.surface} border ${colors.border.default} rounded shadow-lg text-label ${colors.text.secondary} z-20`}>
                          {TOOLTIPS.refreshTime}
                        </div>
                      )}
                    </div>
                  </label>
                  <div className={`h-10 px-3 ${colors.bg.secondary} border ${colors.border.default} rounded flex items-center`}>
                    <input
                      type="text"
                      value={refreshTime}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          setRefreshTime(value);
                        }
                      }}
                      placeholder="5"
                      className={`flex-1 bg-transparent text-numeric ${colors.text.primary} outline-none`}
                    />
                  </div>
                </div>
              </div>

              {/* Inventory Skew */}
              <div className="mb-3">
                <label className={`text-label ${colors.text.secondary} block mb-1.5 flex items-center gap-1`}>
                  Inventory Skew: {inventorySkew}%
                  <div className="relative inline-block">
                    <Info 
                      className="w-3.5 h-3.5 cursor-help" 
                      onMouseEnter={() => setActiveTooltip('inventorySkew')}
                      onMouseLeave={() => setActiveTooltip(null)}
                    />
                    {activeTooltip === 'inventorySkew' && (
                      <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 ${colors.bg.surface} border ${colors.border.default} rounded shadow-lg text-label ${colors.text.secondary} z-20`}>
                        {TOOLTIPS.inventorySkew}
                      </div>
                    )}
                  </div>
                </label>
                <div className="flex items-center gap-3">
                  <span className={`text-label ${colors.text.tertiary}`}>-50%</span>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={inventorySkew}
                    onChange={(e) => setInventorySkew(e.target.value)}
                    className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#C9A36A]"
                  />
                  <span className={`text-label ${colors.text.tertiary}`}>+50%</span>
                </div>
                <p className={`text-label ${colors.text.tertiary} mt-1.5`}>
                  Negative values favor selling, positive values favor buying
                </p>
              </div>

              {/* Min & Max Spread */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-label ${colors.text.secondary} block mb-2 flex items-center gap-1`}>
                    Min Spread (bps)
                    <div className="relative inline-block">
                      <Info 
                        className="w-3.5 h-3.5 cursor-help" 
                        onMouseEnter={() => setActiveTooltip('minSpread')}
                        onMouseLeave={() => setActiveTooltip(null)}
                      />
                      {activeTooltip === 'minSpread' && (
                        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 ${colors.bg.surface} border ${colors.border.default} rounded shadow-lg text-label ${colors.text.secondary} z-20`}>
                          {TOOLTIPS.minSpread}
                        </div>
                      )}
                    </div>
                  </label>
                  <div className={`h-10 px-3 ${colors.bg.secondary} border ${colors.border.default} rounded flex items-center`}>
                    <input
                      type="text"
                      value={minSpread}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          setMinSpread(value);
                        }
                      }}
                      placeholder="5"
                      className={`flex-1 bg-transparent text-numeric ${colors.text.primary} outline-none`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`text-label ${colors.text.secondary} block mb-2 flex items-center gap-1`}>
                    Max Spread (bps)
                    <div className="relative inline-block">
                      <Info 
                        className="w-3.5 h-3.5 cursor-help" 
                        onMouseEnter={() => setActiveTooltip('maxSpread')}
                        onMouseLeave={() => setActiveTooltip(null)}
                      />
                      {activeTooltip === 'maxSpread' && (
                        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 ${colors.bg.surface} border ${colors.border.default} rounded shadow-lg text-label ${colors.text.secondary} z-20`}>
                          {TOOLTIPS.maxSpread}
                        </div>
                      )}
                    </div>
                  </label>
                  <div className={`h-10 px-3 ${colors.bg.secondary} border ${colors.border.default} rounded flex items-center`}>
                    <input
                      type="text"
                      value={maxSpread}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          setMaxSpread(value);
                        }
                      }}
                      placeholder="50"
                      className={`flex-1 bg-transparent text-numeric ${colors.text.primary} outline-none`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Management */}
            <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-4`}>
              <h3 className="text-button font-medium mb-3">Risk Management</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-label ${colors.text.secondary} block mb-2 flex items-center gap-1`}>
                    Stop Loss (%)
                    <div className="relative inline-block">
                      <Info 
                        className="w-3.5 h-3.5 cursor-help" 
                        onMouseEnter={() => setActiveTooltip('stopLoss')}
                        onMouseLeave={() => setActiveTooltip(null)}
                      />
                      {activeTooltip === 'stopLoss' && (
                        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 ${colors.bg.surface} border ${colors.border.default} rounded shadow-lg text-label ${colors.text.secondary} z-20`}>
                          {TOOLTIPS.stopLoss}
                        </div>
                      )}
                    </div>
                  </label>
                  <div className={`h-10 px-3 ${colors.bg.secondary} border ${colors.border.default} rounded flex items-center`}>
                    <input
                      type="text"
                      value={stopLoss}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          setStopLoss(value);
                        }
                      }}
                      placeholder="2"
                      className={`flex-1 bg-transparent text-numeric ${colors.text.primary} outline-none`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`text-label ${colors.text.secondary} block mb-2 flex items-center gap-1`}>
                    Take Profit (%)
                    <div className="relative inline-block">
                      <Info 
                        className="w-3.5 h-3.5 cursor-help" 
                        onMouseEnter={() => setActiveTooltip('takeProfit')}
                        onMouseLeave={() => setActiveTooltip(null)}
                      />
                      {activeTooltip === 'takeProfit' && (
                        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 ${colors.bg.surface} border ${colors.border.default} rounded shadow-lg text-label ${colors.text.secondary} z-20`}>
                          {TOOLTIPS.takeProfit}
                        </div>
                      )}
                    </div>
                  </label>
                  <div className={`h-10 px-3 ${colors.bg.secondary} border ${colors.border.default} rounded flex items-center`}>
                    <input
                      type="text"
                      value={takeProfit}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          setTakeProfit(value);
                        }
                      }}
                      placeholder="5"
                      className={`flex-1 bg-transparent text-numeric ${colors.text.primary} outline-none`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Participation Rate */}
            <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-4`}>
              <div className="flex items-center gap-1 mb-3">
                <h3 className="text-button font-medium">Participation Rate</h3>
                <div className="relative inline-block">
                  <Info 
                    className="w-3.5 h-3.5 cursor-help" 
                    onMouseEnter={() => setActiveTooltip('participationRate')}
                    onMouseLeave={() => setActiveTooltip(null)}
                  />
                  {activeTooltip === 'participationRate' && (
                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 ${colors.bg.surface} border ${colors.border.default} rounded shadow-lg text-label ${colors.text.secondary} z-20`}>
                      {TOOLTIPS.participationRate}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setParticipationRate('passive')}
                  className={`h-14 px-3 rounded border-2 transition-all ${
                    participationRate === 'passive'
                      ? `border-[#C9A36A] ${colors.bg.subtle}`
                      : `${colors.border.default} ${colors.bg.secondary}`
                  }`}
                >
                  <div className="flex flex-col items-center justify-center gap-0.5">
                    <span className={`text-button font-medium ${colors.text.primary}`}>Passive</span>
                    <span className={`text-label ${colors.text.tertiary}`}>30-60 min</span>
                  </div>
                </button>

                <button
                  onClick={() => setParticipationRate('neutral')}
                  className={`h-14 px-3 rounded border-2 transition-all ${
                    participationRate === 'neutral'
                      ? `border-[#C9A36A] ${colors.bg.subtle}`
                      : `${colors.border.default} ${colors.bg.secondary}`
                  }`}
                >
                  <div className="flex flex-col items-center justify-center gap-0.5">
                    <span className={`text-button font-medium ${colors.text.primary}`}>Neutral</span>
                    <span className={`text-label ${colors.text.tertiary}`}>15 min</span>
                  </div>
                </button>

                <button
                  onClick={() => setParticipationRate('aggressive')}
                  className={`h-14 px-3 rounded border-2 transition-all ${
                    participationRate === 'aggressive'
                      ? `border-[#C9A36A] ${colors.bg.subtle}`
                      : `${colors.border.default} ${colors.bg.secondary}`
                  }`}
                >
                  <div className="flex flex-col items-center justify-center gap-0.5">
                    <span className={`text-button font-medium ${colors.text.primary}`}>Aggressive</span>
                    <span className={`text-label ${colors.text.tertiary}`}>5 min</span>
                  </div>
                </button>
              </div>
              
              <p className={`text-label ${colors.text.tertiary} mt-2`}>
                Based on $30 margin at 50x leverage for $30k volume in deeply liquid pools
              </p>
            </div>

            {/* Auto-repeat Settings */}
            <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-4`}>
              <h3 className="text-button font-medium mb-3">Auto-repeat Settings</h3>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={`text-label ${colors.text.secondary} block mb-2 flex items-center gap-1`}>
                    Auto-repeat
                    <div className="relative inline-block">
                      <Info 
                        className="w-3.5 h-3.5 cursor-help" 
                        onMouseEnter={() => setActiveTooltip('autoRepeat')}
                        onMouseLeave={() => setActiveTooltip(null)}
                      />
                      {activeTooltip === 'autoRepeat' && (
                        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 ${colors.bg.surface} border ${colors.border.default} rounded shadow-lg text-label ${colors.text.secondary} z-20`}>
                          {TOOLTIPS.autoRepeat}
                        </div>
                      )}
                    </div>
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={enableAutoRepeat}
                      onChange={(e) => setEnableAutoRepeat(e.target.checked)}
                      className="w-4 h-4 bg-gray-50 rounded border-gray-300 focus:ring-3 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600"
                    />
                    <span className={`text-label ${colors.text.secondary} ml-2`}>Enable</span>
                  </div>
                </div>

                <div>
                  <label className={`text-label ${colors.text.secondary} block mb-2 flex items-center gap-1`}>
                    Max Runs
                    <div className="relative inline-block">
                      <Info 
                        className="w-3.5 h-3.5 cursor-help" 
                        onMouseEnter={() => setActiveTooltip('maxRuns')}
                        onMouseLeave={() => setActiveTooltip(null)}
                      />
                      {activeTooltip === 'maxRuns' && (
                        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 ${colors.bg.surface} border ${colors.border.default} rounded shadow-lg text-label ${colors.text.secondary} z-20`}>
                          {TOOLTIPS.maxRuns}
                        </div>
                      )}
                    </div>
                  </label>
                  <div className={`h-10 px-3 ${colors.bg.secondary} border ${colors.border.default} rounded flex items-center`}>
                    <input
                      type="text"
                      value={maxRuns}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d*$/.test(value)) {
                          setMaxRuns(value);
                        }
                      }}
                      placeholder="3"
                      className={`flex-1 bg-transparent text-numeric ${colors.text.primary} outline-none`}
                    />
                  </div>
                </div>
              </div>

              {/* PNL Tolerance */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-label ${colors.text.secondary} block mb-2 flex items-center gap-1`}>
                    PNL Tolerance
                    <div className="relative inline-block">
                      <Info 
                        className="w-3.5 h-3.5 cursor-help" 
                        onMouseEnter={() => setActiveTooltip('pnlTolerance')}
                        onMouseLeave={() => setActiveTooltip(null)}
                      />
                      {activeTooltip === 'pnlTolerance' && (
                        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 ${colors.bg.surface} border ${colors.border.default} rounded shadow-lg text-label ${colors.text.secondary} z-20`}>
                          {TOOLTIPS.pnlTolerance}
                        </div>
                      )}
                    </div>
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={enablePnlTolerance}
                      onChange={(e) => setEnablePnlTolerance(e.target.checked)}
                      className="w-4 h-4 bg-gray-50 rounded border-gray-300 focus:ring-3 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600"
                    />
                    <span className={`text-label ${colors.text.secondary} ml-2`}>Enable</span>
                  </div>
                </div>

                <div>
                  <label className={`text-label ${colors.text.secondary} block mb-2 flex items-center gap-1`}>
                    Tolerance Percent (±)
                    <div className="relative inline-block">
                      <Info 
                        className="w-3.5 h-3.5 cursor-help" 
                        onMouseEnter={() => setActiveTooltip('tolerancePercent')}
                        onMouseLeave={() => setActiveTooltip(null)}
                      />
                      {activeTooltip === 'tolerancePercent' && (
                        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 ${colors.bg.surface} border ${colors.border.default} rounded shadow-lg text-label ${colors.text.secondary} z-20`}>
                          {TOOLTIPS.tolerancePercent}
                        </div>
                      )}
                    </div>
                  </label>
                  <div className={`h-10 px-3 ${colors.bg.secondary} border ${colors.border.default} rounded flex items-center`}>
                    <input
                      type="text"
                      value={tolerancePercent}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          setTolerancePercent(value);
                        }
                      }}
                      placeholder="2"
                      className={`flex-1 bg-transparent text-numeric ${colors.text.primary} outline-none`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Summary & Actions */}
          <div className="space-y-3">
            {/* Strategy Summary */}
            <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-4`}>
              <h3 className="text-button font-medium mb-4">Strategy Summary</h3>
              
              <div className="space-y-3">
                <div>
                  <div className={`text-label ${colors.text.tertiary} mb-1`}>Exchange</div>
                  <div className={`text-body ${colors.text.primary}`}>
                    {selectedExchange || '—'}
                  </div>
                </div>

                <div>
                  <div className={`text-label ${colors.text.tertiary} mb-1`}>Pair</div>
                  <div className={`text-body ${colors.text.primary}`}>
                    {selectedPair || '—'}
                  </div>
                </div>

                <div className={`border-t ${colors.border.default} pt-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-label ${colors.text.tertiary}`}>Total Margin</span>
                    <span className={`text-numeric ${colors.text.primary}`}>
                      ${margin || '0.00'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-label ${colors.text.tertiary}`}>Leverage</span>
                    <span className={`text-numeric ${colors.text.primary}`}>
                      {leverage}x
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-label ${colors.text.tertiary}`}>Total Volume</span>
                    <span className={`text-numeric font-medium ${colors.text.primary}`}>
                      ${parseFloat(volume).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className={`border-t ${colors.border.default} pt-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-label ${colors.text.tertiary}`}>Base Spread</span>
                    <span className={`text-numeric ${colors.text.primary}`}>
                      {spreadBps} bps
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-label ${colors.text.tertiary}`}>Order Levels</span>
                    <span className={`text-numeric ${colors.text.primary}`}>
                      {orderLevels}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-label ${colors.text.tertiary}`}>Refresh Time</span>
                    <span className={`text-numeric ${colors.text.primary}`}>
                      {refreshTime}s
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Estimated Performance */}
            <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-4`}>
              <h3 className="text-button font-medium mb-4">Estimated Performance</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-label ${colors.text.tertiary}`}>Daily Volume Est.</span>
                  <span className={`text-numeric ${colors.text.primary}`}>
                    ${estimates.dailyVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-label ${colors.text.tertiary}`}>Maker Fees</span>
                  <span className={`text-numeric ${colors.text.primary}`}>
                    ${estimates.makerFees.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-label ${colors.text.tertiary}`}>Est. Daily Return</span>
                  <span className={`text-numeric ${colors.text.primary}`}>
                    ${estimates.dailyReturn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Warnings */}
            <div className={`${colors.bg.surface} border border-orange-300 rounded-lg p-4`}>
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className={`text-label ${colors.text.secondary} mb-1.5`}>
                    Market making involves risk. Please ensure you understand:
                  </p>
                  <ul className={`text-label ${colors.text.tertiary} space-y-0.5 list-disc list-inside`}>
                    <li>Inventory risk from price movements</li>
                    <li>Gas fees and exchange fees</li>
                    <li>Slippage during volatile periods</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Start Button */}
            <div className="relative group">
              <button
                onClick={() => {
                  if (!selectedExchange || !selectedPair || !margin) {
                    toast.error('Select an exchange, trading pair, and margin to start.');
                    if (!selectedExchange || !selectedPair) {
                      setShowExchangePairSelector(true);
                    }
                    return;
                  }
                  
                  // Create strategy for advanced bot
                  const strategyId = `advanced-${selectedPair.replace('/', '')}-${Date.now()}`;
                const newStrategy: ActiveMarketMakerStrategy = {
                  id: strategyId,
                  name: `Advanced Bot - ${selectedPair}`,
                  exchange: selectedExchange,
                  pair: selectedPair,
                  margin: parseFloat(margin) || 0,
                  leverage: parseFloat(leverage) || 1,
                  spreadBps: parseFloat(spreadBps) || 0,
                  orderLevels: parseInt(orderLevels) || 1,
                  orderAmount: parseFloat(orderAmount) || 0,
                  refreshTime: parseFloat(refreshTime) || 0,
                  inventorySkew: parseFloat(inventorySkew) || 0,
                  minSpread: parseFloat(minSpread) || 0,
                  maxSpread: parseFloat(maxSpread) || 0,
                  stopLoss: parseFloat(stopLoss) || 0,
                  takeProfit: parseFloat(takeProfit) || 0,
                  participationRate: participationRate as 'passive' | 'neutral' | 'aggressive',
                  enableAutoRepeat: enableAutoRepeat,
                  maxRuns: parseInt(maxRuns) || 0,
                  enablePnlTolerance: enablePnlTolerance,
                  tolerancePercent: parseFloat(tolerancePercent) || 0,
                  status: 'running',
                  startTime: Date.now(),
                  currentPnl: 0,
                  currentRoi: 0,
                  volume: 0,
                  exposure: (parseFloat(margin) || 0) * (parseFloat(leverage) || 1),
                  runsCompleted: 0,
                };
                
                // Deploy strategy
                deployMarketMakerStrategies([newStrategy]);
                
                // Add to global trades store
                const token = selectedPair.split('-')[0] || selectedPair.split('/')[0] || 'BTC';
                const price = 89128; // Mock BTC price
                const orderAmountUSDC = parseFloat(orderAmount) || 100;
                const tokenSize = orderAmountUSDC / price; // Convert USDC to token amount
                
                // Add order to global trades store
                addOrder({
                  type: 'long',
                  exchange: selectedExchange,
                  token: token,
                  size: tokenSize, // Token size (e.g., 0.00112 BTC)
                  price: price, // Price per token (e.g., 89128 USD)
                  status: 'pending',
                  source: 'market-maker',
                });
                
                addTrade({
                  type: 'long',
                  exchange: selectedExchange,
                  token: token,
                  size: tokenSize,
                  entryPrice: price,
                  source: 'market-maker',
                  leverage: parseFloat(leverage) || 1,
                  volume: parseFloat(volume), // Explicit volume: margin × leverage × 20
                });

                // Add history entry so TradeHistory can show execution detail immediately
                addHistoryEntry({
                  type: 'trade',
                  action: `MM: ${token} on ${selectedExchange}`,
                  amount: tokenSize,
                  token: token,
                  exchange: selectedExchange,
                  status: 'completed',
                  volume: parseFloat(volume) || 0,
                  buyQuantity: orderAmountUSDC,
                  buyLeverage: parseFloat(leverage) || 1,
                  buyExchange: selectedExchange,
                  buyPair: selectedPair,
                  buyPrice: price,
                  duration: parseFloat(refreshTime) || 5,
                  exchanges: [selectedExchange],
                  source: 'market-maker',
                  timestamp: Date.now(),
                });
                
                // Navigate to Portfolio -> History after starting
                toast.success('Market making started.');
                navigateTo('portfolio', 'tab=history&detailTab=execution&trade=mm');
              }}
                className={`w-full h-10 ${colors.button.primaryBg} hover:opacity-90 text-white rounded text-button font-medium transition-all`}
              >
                Start Market Making
              </button>
              
              {/* Tooltip showing what's missing */}
              {(!selectedExchange || !selectedPair || !margin) && (
                <div className={`absolute bottom-full left-0 right-0 mb-2 px-3 py-2 ${colors.bg.surface} border ${colors.border.default} rounded shadow-lg text-label ${colors.text.secondary} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20`}>
                  <div className="font-medium mb-1">Please complete the following:</div>
                  <ul className="list-disc list-inside space-y-0.5">
                    {!selectedExchange && <li>Select an exchange and trading pair</li>}
                    {!selectedPair && selectedExchange && <li>Select a trading pair</li>}
                    {!margin && <li>Enter a margin amount</li>}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Automated Tab Content */}
        {activeTab === 'automated' && (
          <div className="grid grid-cols-[1fr_360px] gap-3">
            {/* Left Column - Vault Grid */}
            <div className="grid grid-cols-2 gap-3">
              {VAULTS.map((vault) => (
                <button
                  key={vault.id}
                  onClick={() => setSelectedVault(vault.id)}
                  className={`${colors.bg.surface} border-2 rounded-lg p-4 text-left transition-all ${
                    selectedVault === vault.id
                      ? `border-[#C9A36A] ${colors.bg.subtle}`
                      : `${colors.border.default} hover:${colors.border.hover}`
                  }`}
                >
                  <h3 className="text-button font-medium mb-3">{vault.name}</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-label ${colors.text.tertiary}`}>PNL</span>
                      <span className={`text-numeric font-medium ${vault.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {vault.pnl >= 0 ? '+' : ''}{vault.pnl}%
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`text-label ${colors.text.tertiary}`}>Volume</span>
                      <span className={`text-numeric ${colors.text.primary}`}>
                        ${(vault.volume / 1000000).toFixed(2)}M
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`text-label ${colors.text.tertiary}`}>TVL</span>
                      <span className={`text-numeric ${colors.text.primary}`}>
                        ${(vault.tvl / 1000000).toFixed(2)}M
                      </span>
                    </div>
                    
                    <div className={`border-t ${colors.border.default} pt-2 mt-2`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-label ${colors.text.tertiary}`}>APY</span>
                        <span className={`text-numeric font-medium ${colors.text.primary}`}>
                          {vault.apy}%
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Right Column - Deployment Controls */}
            <div className="space-y-3">
              {selectedVault ? (
                <>
                  {/* Vault Info */}
                  <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-4`}>
                    <h3 className="text-button font-medium mb-3">Deploy Capital</h3>
                    
                    <div className="mb-3">
                      <div className={`text-label ${colors.text.tertiary} mb-1`}>Selected Vault</div>
                      <div className={`text-body font-medium ${colors.text.primary}`}>
                        {VAULTS.find(v => v.id === selectedVault)?.name}
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className={`text-label ${colors.text.secondary} block mb-1.5`}>
                        Capital (USDC)
                      </label>
                      <div className={`h-10 px-3 ${colors.bg.secondary} border ${colors.border.default} rounded flex items-center`}>
                        <input
                          type="text"
                          value={deployCapital}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                              setDeployCapital(value);
                            }
                          }}
                          placeholder="0.00"
                          className={`flex-1 bg-transparent text-numeric ${colors.text.primary} outline-none`}
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className={`text-label ${colors.text.secondary} block mb-1.5`}>
                        Leverage
                      </label>
                      <div className={`h-10 px-3 ${colors.bg.secondary} border ${colors.border.default} rounded flex items-center`}>
                        <input
                          type="text"
                          value={vaultLeverage}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                              setVaultLeverage(value);
                            }
                          }}
                          placeholder="1"
                          className={`flex-1 bg-transparent text-numeric ${colors.text.primary} outline-none`}
                        />
                        <span className={`text-label ${colors.text.tertiary} ml-2`}>x</span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className={`text-label ${colors.text.secondary} block mb-1.5`}>
                        Slippage Tolerance (%)
                      </label>
                      <div className={`h-10 px-3 ${colors.bg.secondary} border ${colors.border.default} rounded flex items-center`}>
                        <input
                          type="text"
                          value={slippageTolerance}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                              setSlippageTolerance(value);
                            }
                          }}
                          placeholder="0.5"
                          className={`flex-1 bg-transparent text-numeric ${colors.text.primary} outline-none`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`text-label ${colors.text.secondary} block mb-1.5`}>
                        Max Drawdown (%)
                      </label>
                      <div className={`h-10 px-3 ${colors.bg.secondary} border ${colors.border.default} rounded flex items-center`}>
                        <input
                          type="text"
                          value={maxDrawdown}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                              setMaxDrawdown(value);
                            }
                          }}
                          placeholder="5"
                          className={`flex-1 bg-transparent text-numeric ${colors.text.primary} outline-none`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Estimated Performance */}
                  <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-4`}>
                    <h3 className="text-button font-medium mb-4">Estimated Performance</h3>
                    
                    {(() => {
                      const vault = VAULTS.find(v => v.id === selectedVault);
                      const capital = parseFloat(deployCapital) || 0;
                      const estimatedAnnualReturn = capital * (vault!.apy / 100);
                      const estimatedMonthlyReturn = estimatedAnnualReturn / 12;
                      const estimatedVolume = capital * 10; // Estimated 10x capital turnover
                      
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className={`text-label ${colors.text.tertiary}`}>Est. Monthly Return</span>
                            <span className={`text-numeric ${colors.text.primary}`}>
                              ${estimatedMonthlyReturn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className={`text-label ${colors.text.tertiary}`}>Est. Annual Return</span>
                            <span className={`text-numeric ${colors.text.primary}`}>
                              ${estimatedAnnualReturn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className={`text-label ${colors.text.tertiary}`}>Est. Volume (30d)</span>
                            <span className={`text-numeric ${colors.text.primary}`}>
                              ${estimatedVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          
                          <div className={`border-t ${colors.border.default} pt-3 mt-3`}>
                            <div className="flex items-center justify-between">
                              <span className={`text-label ${colors.text.tertiary}`}>Projected APY</span>
                              <span className={`text-numeric font-medium ${colors.text.primary}`}>
                                {vault!.apy}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Deploy Button */}
                  <button
                    disabled={!deployCapital || parseFloat(deployCapital) <= 0}
                    className={`w-full h-10 ${colors.button.primaryBg} hover:opacity-90 text-white rounded text-button font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    Deploy to Vault
                  </button>
                </>
              ) : (
                <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-8`}>
                  <div className="flex flex-col items-center justify-center py-12">
                    <h3 className="text-button font-medium mb-2">Select a Vault</h3>
                    <p className={`text-label ${colors.text.tertiary} text-center`}>
                      Choose a vault to deploy capital and view estimated performance
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Multi-Strategy Tab Content */}
        {activeTab === 'multiOrder' && (
          <div className="space-y-3">
            {/* Header */}
            <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-button font-medium">Multi-Strategy Configuration</h3>
                  <p className={`text-label ${colors.text.tertiary} mt-0.5`}>
                    Configure and execute multiple strategies simultaneously across different exchanges
                  </p>
                </div>
                <button
                  onClick={() => {
                    const newId = (strategies.length + 1).toString();
                    setStrategies([
                      ...strategies,
                      {
                        id: newId,
                        name: `Strategy ${newId}`,
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
                        submitted: false
                      }
                    ]);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 bg-[#C9A36A] hover:bg-[#B8935C] text-white rounded transition-colors text-button font-medium`}
                >
                  <Plus className="w-4 h-4" />
                  Add Strategy
                </button>
              </div>
            </div>

            {/* Strategies Accordion */}
            <div className="space-y-3">
              {strategies.map((strategy, index) => (
                <div key={strategy.id} className={`${colors.bg.surface} border ${colors.border.default} rounded-lg overflow-hidden`}>
                  {/* Accordion Header */}
                  <div 
                    className={`flex items-center justify-between p-4 cursor-pointer hover:${colors.bg.hover} transition-colors`}
                    onClick={() => {
                      setStrategies(strategies.map(s => 
                        s.id === strategy.id ? { ...s, expanded: !s.expanded } : s
                      ));
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <ChevronDown 
                        className={`w-5 h-5 ${colors.text.tertiary} transition-transform ${
                          strategy.expanded ? 'rotate-0' : '-rotate-90'
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`text-button font-medium ${colors.text.primary}`}>
                            {strategy.name}
                          </h4>
                          {strategy.submitted && (
                            <span className="px-2 py-0.5 bg-green-500/10 text-green-600 text-xs font-medium rounded">
                              ✓ Configured
                            </span>
                          )}
                        </div>
                        <p className={`text-label ${colors.text.tertiary} mt-0.5`}>
                          {strategy.exchange && strategy.pair 
                            ? `${strategy.exchange} • ${strategy.pair}`
                            : 'Not configured'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadingStrategyId(strategy.id);
                          setShowUploadModal(true);
                        }}
                        className={`px-3 py-1.5 rounded hover:${colors.bg.hover} transition-colors flex items-center gap-2`}
                        title="Upload JSON configuration"
                      >
                        <Upload className={`w-4 h-4 ${colors.text.tertiary}`} />
                        <span className={`text-label ${colors.text.tertiary} uppercase tracking-wide`}>Upload JSON</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (strategies.length > 1) {
                            setStrategies(strategies.filter(s => s.id !== strategy.id));
                          }
                        }}
                        disabled={strategies.length === 1}
                        className={`p-2 rounded hover:${colors.bg.hover} transition-colors ${
                          strategies.length === 1 ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                      >
                        <Trash2 className={`w-4 h-4 ${colors.text.tertiary}`} />
                      </button>
                    </div>
                  </div>

                  {/* Accordion Content */}
                  {strategy.expanded && (
                    <div className={`p-4 border-t ${colors.border.default}`}>
                      <div className="grid grid-cols-[1fr_320px] gap-4">
                        {/* Left Column - Configuration */}
                        <div className="space-y-4">
                          {/* Strategy Name */}
                          <div>
                            <label className={`text-label ${colors.text.secondary} block mb-1.5`}>
                              Strategy Name
                            </label>
                            <input
                              type="text"
                              value={strategy.name}
                              onChange={(e) => {
                                setStrategies(strategies.map(s =>
                                  s.id === strategy.id ? { ...s, name: e.target.value } : s
                                ));
                              }}
                              className={`w-full h-10 px-3 ${colors.bg.secondary} border ${colors.border.default} rounded text-body ${colors.text.primary} outline-none focus:${colors.border.tertiary}`}
                            />
                          </div>

                      {/* Exchange & Pair Selection */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={`text-label ${colors.text.secondary} block mb-1.5`}>
                            Exchange
                          </label>
                          <button
                            onClick={() => {
                              setEditingStrategyId(strategy.id);
                              setShowExchangePairSelector(true);
                            }}
                            className={`w-full h-10 px-3 ${colors.bg.secondary} border ${colors.border.default} rounded flex items-center justify-between text-body ${strategy.exchange ? colors.text.primary : colors.text.tertiary} hover:${colors.border.hover} transition-colors`}
                          >
                            {strategy.exchange || 'Select Exchange'}
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>

                        <div>
                          <label className={`text-label ${colors.text.secondary} block mb-1.5`}>
                            Trading Pair
                          </label>
                          <button
                            onClick={() => {
                              setEditingStrategyId(strategy.id);
                              setShowExchangePairSelector(true);
                            }}
                            className={`w-full h-10 px-3 ${colors.bg.secondary} border ${colors.border.default} rounded flex items-center justify-between text-body ${strategy.pair ? colors.text.primary : colors.text.tertiary} hover:${colors.border.hover} transition-colors`}
                          >
                            {strategy.pair || 'Select Pair'}
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Margin & Leverage */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={`text-label ${colors.text.secondary} block mb-1.5`}>
                            Margin (USDC)
                          </label>
                          <div className={`h-10 px-3 ${colors.bg.secondary} border ${colors.border.default} rounded flex items-center`}>
                            <input
                              type="text"
                              value={strategy.margin}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  setStrategies(strategies.map(s =>
                                    s.id === strategy.id ? { ...s, margin: value } : s
                                  ));
                                }
                              }}
                              placeholder="0.00"
                              className={`flex-1 bg-transparent text-numeric ${colors.text.primary} outline-none`}
                            />
                          </div>
                        </div>

                        <div>
                          <label className={`text-label ${colors.text.secondary} block mb-1.5`}>
                            Leverage
                          </label>
                          <div className={`h-10 px-3 ${colors.bg.secondary} border ${colors.border.default} rounded flex items-center`}>
                            <input
                              type="text"
                              value={strategy.leverage}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  setStrategies(strategies.map(s =>
                                    s.id === strategy.id ? { ...s, leverage: value } : s
                                  ));
                                }
                              }}
                              placeholder="1"
                              className={`flex-1 bg-transparent text-numeric ${colors.text.primary} outline-none`}
                            />
                            <span className={`text-label ${colors.text.tertiary} ml-2`}>x</span>
                          </div>
                        </div>
                      </div>

                      {/* Market Making Parameters */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={`text-label ${colors.text.secondary} block mb-1.5`}>
                            Base Spread (bps)
                          </label>
                          <div className={`h-10 px-3 ${colors.bg.secondary} border ${colors.border.default} rounded flex items-center`}>
                            <input
                              type="text"
                              value={strategy.spreadBps}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  setStrategies(strategies.map(s =>
                                    s.id === strategy.id ? { ...s, spreadBps: value } : s
                                  ));
                                }
                              }}
                              placeholder="10"
                              className={`flex-1 bg-transparent text-numeric ${colors.text.primary} outline-none`}
                            />
                          </div>
                        </div>

                        <div>
                          <label className={`text-label ${colors.text.secondary} block mb-1.5`}>
                            Order Levels
                          </label>
                          <div className={`h-10 px-3 ${colors.bg.secondary} border ${colors.border.default} rounded flex items-center`}>
                            <input
                              type="text"
                              value={strategy.orderLevels}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d*$/.test(value)) {
                                  setStrategies(strategies.map(s =>
                                    s.id === strategy.id ? { ...s, orderLevels: value } : s
                                  ));
                                }
                              }}
                              placeholder="5"
                              className={`flex-1 bg-transparent text-numeric ${colors.text.primary} outline-none`}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={`text-label ${colors.text.secondary} block mb-1.5`}>
                            Order Amount (USDC)
                          </label>
                          <div className={`h-10 px-3 ${colors.bg.secondary} border ${colors.border.default} rounded flex items-center`}>
                            <input
                              type="text"
                              value={strategy.orderAmount}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  setStrategies(strategies.map(s =>
                                    s.id === strategy.id ? { ...s, orderAmount: value } : s
                                  ));
                                }
                              }}
                              placeholder="100"
                              className={`flex-1 bg-transparent text-numeric ${colors.text.primary} outline-none`}
                            />
                          </div>
                        </div>

                        <div>
                          <label className={`text-label ${colors.text.secondary} block mb-1.5`}>
                            Refresh Time (seconds)
                          </label>
                          <div className={`h-10 px-3 ${colors.bg.secondary} border ${colors.border.default} rounded flex items-center`}>
                            <input
                              type="text"
                              value={strategy.refreshTime}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  setStrategies(strategies.map(s =>
                                    s.id === strategy.id ? { ...s, refreshTime: value } : s
                                  ));
                                }
                              }}
                              placeholder="5"
                              className={`flex-1 bg-transparent text-numeric ${colors.text.primary} outline-none`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Inventory Skew */}
                      <div>
                        <label className={`text-label ${colors.text.secondary} block mb-1.5`}>
                          Inventory Skew: {strategy.inventorySkew}%
                        </label>
                        <div className="flex items-center gap-3">
                          <span className={`text-label ${colors.text.tertiary}`}>-50%</span>
                          <input
                            type="range"
                            min="-50"
                            max="50"
                            value={strategy.inventorySkew}
                            onChange={(e) => {
                              setStrategies(strategies.map(s =>
                                s.id === strategy.id ? { ...s, inventorySkew: e.target.value } : s
                              ));
                            }}
                            className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#C9A36A]"
                          />
                          <span className={`text-label ${colors.text.tertiary}`}>+50%</span>
                        </div>
                        <p className={`text-label ${colors.text.tertiary} mt-1.5`}>
                          Negative values favor selling, positive values favor buying
                        </p>
                      </div>

                      {/* Min & Max Spread */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={`text-label ${colors.text.secondary} block mb-1.5`}>
                            Min Spread (bps)
                          </label>
                          <div className={`h-10 px-3 ${colors.bg.secondary} border ${colors.border.default} rounded flex items-center`}>
                            <input
                              type="text"
                              value={strategy.minSpread}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  setStrategies(strategies.map(s =>
                                    s.id === strategy.id ? { ...s, minSpread: value } : s
                                  ));
                                }
                              }}
                              placeholder="5"
                              className={`flex-1 bg-transparent text-numeric ${colors.text.primary} outline-none`}
                            />
                          </div>
                        </div>

                        <div>
                          <label className={`text-label ${colors.text.secondary} block mb-1.5`}>
                            Max Spread (bps)
                          </label>
                          <div className={`h-10 px-3 ${colors.bg.secondary} border ${colors.border.default} rounded flex items-center`}>
                            <input
                              type="text"
                              value={strategy.maxSpread}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  setStrategies(strategies.map(s =>
                                    s.id === strategy.id ? { ...s, maxSpread: value } : s
                                  ));
                                }
                              }}
                              placeholder="50"
                              className={`flex-1 bg-transparent text-numeric ${colors.text.primary} outline-none`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Stop Loss & Take Profit */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={`text-label ${colors.text.secondary} block mb-1.5`}>
                            Stop Loss (%)
                          </label>
                          <div className={`h-10 px-3 ${colors.bg.secondary} border ${colors.border.default} rounded flex items-center`}>
                            <input
                              type="text"
                              value={strategy.stopLoss}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  setStrategies(strategies.map(s =>
                                    s.id === strategy.id ? { ...s, stopLoss: value } : s
                                  ));
                                }
                              }}
                              placeholder="2"
                              className={`flex-1 bg-transparent text-numeric ${colors.text.primary} outline-none`}
                            />
                          </div>
                        </div>

                        <div>
                          <label className={`text-label ${colors.text.secondary} block mb-1.5`}>
                            Take Profit (%)
                          </label>
                          <div className={`h-10 px-3 ${colors.bg.secondary} border ${colors.border.default} rounded flex items-center`}>
                            <input
                              type="text"
                              value={strategy.takeProfit}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  setStrategies(strategies.map(s =>
                                    s.id === strategy.id ? { ...s, takeProfit: value } : s
                                  ));
                                }
                              }}
                              placeholder="5"
                              className={`flex-1 bg-transparent text-numeric ${colors.text.primary} outline-none`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Participation Rate */}
                      <div>
                        <label className={`text-label ${colors.text.secondary} block mb-2`}>
                          Participation Rate
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {['passive', 'neutral', 'aggressive'].map((rate) => (
                            <button
                              key={rate}
                              onClick={() => {
                                setStrategies(strategies.map(s =>
                                  s.id === strategy.id ? { ...s, participationRate: rate as 'passive' | 'neutral' | 'aggressive' } : s
                                ));
                              }}
                              className={`h-10 px-3 border rounded text-button font-medium transition-colors ${
                                strategy.participationRate === rate
                                  ? `bg-[#C9A36A] border-[#C9A36A] text-white`
                                  : `${colors.bg.secondary} ${colors.border.default} ${colors.text.secondary} hover:${colors.border.hover}`
                              }`}
                            >
                              {rate.charAt(0).toUpperCase() + rate.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Auto-repeat Settings */}
                      <div className={`border-t ${colors.border.default} pt-4`}>
                        <h4 className={`text-button font-medium mb-3 ${colors.text.primary}`}>Auto-repeat Settings</h4>
                        
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className={`text-label ${colors.text.secondary} block mb-2`}>
                              Auto-repeat
                            </label>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={strategy.enableAutoRepeat}
                                onChange={(e) => {
                                  setStrategies(strategies.map(s =>
                                    s.id === strategy.id ? { ...s, enableAutoRepeat: e.target.checked } : s
                                  ));
                                }}
                                className="w-4 h-4 bg-gray-50 rounded border-gray-300 focus:ring-3 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600"
                              />
                              <span className={`text-label ${colors.text.secondary} ml-2`}>Enable</span>
                            </div>
                          </div>

                          <div>
                            <label className={`text-label ${colors.text.secondary} block mb-2`}>
                              Max Runs
                            </label>
                            <div className={`h-10 px-3 ${colors.bg.secondary} border ${colors.border.default} rounded flex items-center`}>
                              <input
                                type="text"
                                value={strategy.maxRuns}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '' || /^\d*$/.test(value)) {
                                    setStrategies(strategies.map(s =>
                                      s.id === strategy.id ? { ...s, maxRuns: value } : s
                                    ));
                                  }
                                }}
                                placeholder="3"
                                className={`flex-1 bg-transparent text-numeric ${colors.text.primary} outline-none`}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={`text-label ${colors.text.secondary} block mb-2`}>
                              PNL Tolerance
                            </label>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={strategy.enablePnlTolerance}
                                onChange={(e) => {
                                  setStrategies(strategies.map(s =>
                                    s.id === strategy.id ? { ...s, enablePnlTolerance: e.target.checked } : s
                                  ));
                                }}
                                className="w-4 h-4 bg-gray-50 rounded border-gray-300 focus:ring-3 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600"
                              />
                              <span className={`text-label ${colors.text.secondary} ml-2`}>Enable</span>
                            </div>
                          </div>

                          <div>
                            <label className={`text-label ${colors.text.secondary} block mb-2`}>
                              Tolerance Percent (±)
                            </label>
                            <div className={`h-10 px-3 ${colors.bg.secondary} border ${colors.border.default} rounded flex items-center`}>
                              <input
                                type="text"
                                value={strategy.tolerancePercent}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                    setStrategies(strategies.map(s =>
                                      s.id === strategy.id ? { ...s, tolerancePercent: value } : s
                                    ));
                                  }
                                }}
                                placeholder="2"
                                className={`flex-1 bg-transparent text-numeric ${colors.text.primary} outline-none`}
                              />
                              <span className={`text-label ${colors.text.tertiary} ml-2`}>%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                        </div>

                        {/* Right Column - Summary & Performance */}
                        <div className="space-y-4">
                          {/* Strategy Summary */}
                          <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-4`}>
                            <h3 className="text-button font-medium mb-3">Strategy Summary</h3>
                            
                            <div className="space-y-3">
                              <div>
                                <div className={`text-label ${colors.text.tertiary} mb-1`}>Exchange</div>
                                <div className={`text-body ${colors.text.primary}`}>
                                  {strategy.exchange || '—'}
                                </div>
                              </div>

                              <div>
                                <div className={`text-label ${colors.text.tertiary} mb-1`}>Pair</div>
                                <div className={`text-body ${colors.text.primary}`}>
                                  {strategy.pair || '—'}
                                </div>
                              </div>

                              <div className={`border-t ${colors.border.default} pt-3`}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`text-label ${colors.text.tertiary}`}>Total Margin</span>
                                  <span className={`text-numeric ${colors.text.primary}`}>
                                    ${strategy.margin || '0.00'}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`text-label ${colors.text.tertiary}`}>Leverage</span>
                                  <span className={`text-numeric ${colors.text.primary}`}>
                                    {strategy.leverage}x
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className={`text-label ${colors.text.tertiary}`}>Total Volume</span>
                                  <span className={`text-numeric font-medium ${colors.text.primary}`}>
                                    ${(() => {
                                      const marginNum = parseFloat(strategy.margin) || 0;
                                      const leverageNum = parseFloat(strategy.leverage) || 1;
                                      const volume = marginNum * leverageNum * 20;
                                      return volume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                    })()}
                                  </span>
                                </div>
                              </div>

                              <div className={`border-t ${colors.border.default} pt-3`}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`text-label ${colors.text.tertiary}`}>Base Spread</span>
                                  <span className={`text-numeric ${colors.text.primary}`}>
                                    {strategy.spreadBps} bps
                                  </span>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`text-label ${colors.text.tertiary}`}>Order Levels</span>
                                  <span className={`text-numeric ${colors.text.primary}`}>
                                    {strategy.orderLevels}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className={`text-label ${colors.text.tertiary}`}>Refresh Time</span>
                                  <span className={`text-numeric ${colors.text.primary}`}>
                                    {strategy.refreshTime}s
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Estimated Performance */}
                          <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-4`}>
                            <h3 className="text-button font-medium mb-3">Estimated Performance</h3>
                            
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className={`text-label ${colors.text.tertiary}`}>Daily Volume Est.</span>
                                <span className={`text-numeric ${colors.text.primary}`}>
                                  ${(() => {
                                    const marginNum = parseFloat(strategy.margin) || 0;
                                    const leverageNum = parseFloat(strategy.leverage) || 1;
                                    const volume = marginNum * leverageNum * 20;
                                    const maxRunsNum = parseFloat(strategy.maxRuns) || 1;
                                    const timePerRunMinutes = {
                                      aggressive: 5,
                                      neutral: 15,
                                      passive: 45,
                                    }[strategy.participationRate];
                                    const maxPossibleRunsPerDay = Math.floor((24 * 60) / timePerRunMinutes);
                                    let actualRunsPerDay = 1;
                                    if (strategy.enableAutoRepeat) {
                                      actualRunsPerDay = Math.min(maxPossibleRunsPerDay, maxRunsNum);
                                    }
                                    const dailyVolume = volume * actualRunsPerDay;
                                    return dailyVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                  })()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className={`text-label ${colors.text.tertiary}`}>Maker Fees</span>
                                <span className={`text-numeric ${colors.text.primary}`}>
                                  ${(() => {
                                    const marginNum = parseFloat(strategy.margin) || 0;
                                    const leverageNum = parseFloat(strategy.leverage) || 1;
                                    const volume = marginNum * leverageNum * 20;
                                    const maxRunsNum = parseFloat(strategy.maxRuns) || 1;
                                    const timePerRunMinutes = {
                                      aggressive: 5,
                                      neutral: 15,
                                      passive: 45,
                                    }[strategy.participationRate];
                                    const maxPossibleRunsPerDay = Math.floor((24 * 60) / timePerRunMinutes);
                                    let actualRunsPerDay = 1;
                                    if (strategy.enableAutoRepeat) {
                                      actualRunsPerDay = Math.min(maxPossibleRunsPerDay, maxRunsNum);
                                    }
                                    const dailyVolume = volume * actualRunsPerDay;
                                    const makerFeeRate = -0.0001;
                                    const makerFees = dailyVolume * Math.abs(makerFeeRate);
                                    return makerFees.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                  })()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className={`text-label ${colors.text.tertiary}`}>Est. Daily Return</span>
                                <span className={`text-numeric ${colors.text.primary}`}>
                                  ${(() => {
                                    const marginNum = parseFloat(strategy.margin) || 0;
                                    const leverageNum = parseFloat(strategy.leverage) || 1;
                                    const volume = marginNum * leverageNum * 20;
                                    const spreadBpsNum = parseFloat(strategy.spreadBps) || 0;
                                    const maxRunsNum = parseFloat(strategy.maxRuns) || 1;
                                    const timePerRunMinutes = {
                                      aggressive: 5,
                                      neutral: 15,
                                      passive: 45,
                                    }[strategy.participationRate];
                                    const maxPossibleRunsPerDay = Math.floor((24 * 60) / timePerRunMinutes);
                                    let actualRunsPerDay = 1;
                                    if (strategy.enableAutoRepeat) {
                                      actualRunsPerDay = Math.min(maxPossibleRunsPerDay, maxRunsNum);
                                    }
                                    const dailyVolume = volume * actualRunsPerDay;
                                    const makerFeeRate = -0.0001;
                                    const makerFees = dailyVolume * Math.abs(makerFeeRate);
                                    const spreadCaptureRate = (spreadBpsNum / 10000) / 2;
                                    const spreadProfit = dailyVolume * spreadCaptureRate;
                                    const dailyReturn = spreadProfit + makerFees;
                                    return dailyReturn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                  })()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Submit Strategy Button */}
                      <div className={`pt-4 border-t ${colors.border.default} mt-4`}>
                        <button
                          onClick={() => validateAndSubmitStrategy(strategy.id)}
                          className="w-full px-6 py-3 bg-[#C9A36A] hover:bg-[#B8935C] text-white rounded transition-colors text-button font-medium"
                        >
                          Submit Strategy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Deploy All Button */}
            <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-body ${colors.text.secondary}`}>
                    <span className="font-medium">{strategies.length}</span> {strategies.length === 1 ? 'strategy' : 'strategies'} configured
                  </p>
                  <p className={`text-label ${colors.text.tertiary} mt-0.5`}>
                    All strategies will be deployed simultaneously
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={runSimulation}
                    className={`px-6 py-2.5 ${colors.bg.secondary} hover:${colors.bg.hover} border ${colors.border.default} rounded transition-colors text-button font-medium ${colors.text.primary}`}
                  >
                    Run a Simulation
                  </button>
                  <button
                    onClick={handleDeployAllStrategies}
                    className="px-6 py-2.5 bg-[#C9A36A] hover:bg-[#B8935C] text-white rounded transition-colors text-button font-medium"
                  >
                    Deploy All Strategies
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Exchange Points Tab Content */}
        {activeTab === 'exchangePoints' && (
          <div className="space-y-3">
            <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-4`}>
              <h3 className="text-button font-medium mb-4">Exchange Points Overview</h3>
              <p className={`text-label ${colors.text.tertiary} mb-6`}>
                Track your rewards points across connected exchanges
              </p>

              <div className="space-y-3">
                {EXCHANGE_POINTS.map((exchange) => (
                  <div
                    key={exchange.name}
                    className={`${colors.bg.secondary} border ${colors.border.default} rounded-lg p-4`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <h4 className={`text-body font-medium ${colors.text.primary}`}>
                            {exchange.name}
                          </h4>
                          <p className={`text-label ${colors.text.tertiary} mt-0.5`}>
                            {exchange.supportsPoints 
                              ? exchange.status === 'concluded' 
                                ? 'Points Program Concluded' 
                                : 'Points Program Active'
                              : 'No Points Program'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        {exchange.supportsPoints ? (
                          <>
                            <div className={`text-h4 font-medium ${colors.text.primary}`}>
                              {exchange.pointsEarned?.toLocaleString()}
                            </div>
                            <div className={`text-label ${colors.text.tertiary}`}>
                              Points Earned
                            </div>
                          </>
                        ) : (
                          <div className={`text-label ${colors.text.tertiary}`}>
                            N/A
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Enterprise Tab Content */}
        {activeTab === 'enterprise' && (
          !isEnterpriseAuthenticated ? (
            <div className="flex items-center justify-center py-12">
              <div className={`${colors.bg.surface} rounded-lg p-6 border ${colors.border.default} w-full max-w-md`}>
                <h3 className="text-center text-[15px] font-semibold mb-1.5 tracking-tight">Enterprise Access</h3>
                <p className={`text-center ${colors.text.secondary} text-body mb-5`}>
                  Enter your enterprise code to unlock advanced features
                </p>
                
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Enter enterprise code"
                    value={enterpriseCode}
                    onChange={(e) => setEnterpriseCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleEnterpriseSubmit();
                      }
                    }}
                    className={`w-full px-3 py-2 border ${colors.border.default} rounded-lg ${colors.bg.secondary} ${colors.text.primary} text-body focus:outline-none focus:ring-1 focus:ring-[#C9A36A]`}
                  />
                  
                  <button
                    onClick={handleEnterpriseSubmit}
                    className="w-full px-4 py-2 bg-[#C9A36A] hover:bg-[#B8935F] text-white rounded-lg text-button font-medium transition-colors"
                  >
                    Submit
                  </button>
                  
                  <p className={`text-center text-label ${colors.text.tertiary}`}>
                    Don't have access?{' '}
                    <a 
                      href="mailto:enterprise@bitfrost.ai" 
                      className="text-[#C9A36A] hover:underline"
                    >
                      Contact us
                    </a>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {!selectedEnterpriseFeature ? (
                <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-6`}>
                  <h3 className="text-h4 font-semibold mb-4">Enterprise Features</h3>
                  <p className={`text-body ${colors.text.secondary} mb-6`}>
                    Welcome to the enterprise dashboard. Access to advanced trading features and analytics.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setSelectedEnterpriseFeature('analytics')}
                      className={`${colors.bg.secondary} rounded-lg p-4 border ${colors.border.default} hover:border-[#C9A36A] transition-all text-left`}
                    >
                      <h4 className={`text-button font-medium ${colors.text.primary} mb-2`}>Advanced Analytics</h4>
                      <p className={`text-label ${colors.text.tertiary}`}>
                        Real-time market analysis and custom reporting
                      </p>
                    </button>
                    
                    <button
                      onClick={() => setSelectedEnterpriseFeature('support')}
                      className={`${colors.bg.secondary} rounded-lg p-4 border ${colors.border.default} hover:border-[#C9A36A] transition-all text-left`}
                    >
                      <h4 className={`text-button font-medium ${colors.text.primary} mb-2`}>Vault Management</h4>
                      <p className={`text-label ${colors.text.tertiary}`}>
                        Manage your vault deposits, withdrawals, and earnings
                      </p>
                    </button>
                    
                    <button
                      onClick={() => setSelectedEnterpriseFeature('strategies')}
                      className={`${colors.bg.secondary} rounded-lg p-4 border ${colors.border.default} hover:border-[#C9A36A] transition-all text-left`}
                    >
                      <h4 className={`text-button font-medium ${colors.text.primary} mb-2`}>Custom Strategies</h4>
                      <p className={`text-label ${colors.text.tertiary}`}>
                        Build and deploy custom trading algorithms
                      </p>
                    </button>
                    
                    <button
                      onClick={() => setSelectedEnterpriseFeature('api')}
                      className={`${colors.bg.secondary} rounded-lg p-4 border ${colors.border.default} hover:border-[#C9A36A] transition-all text-left`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className={`text-button font-medium ${colors.text.primary} mb-2`}>Vault Creation</h4>
                          <p className={`text-label ${colors.text.tertiary}`}>
                            Create vaults to leverage user capital for your strategies
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className={`w-2 h-2 rounded-full ${creatorDeposit > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className={`text-label ${colors.text.secondary} uppercase tracking-wide whitespace-nowrap`}>
                            {creatorDeposit > 0 ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              ) : selectedEnterpriseFeature === 'strategies' ? (
                <div className="space-y-3">
                  {/* Header with back button */}
                  <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-6`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedEnterpriseFeature(null)}
                          className={`text-label ${colors.text.secondary} hover:${colors.text.primary} transition-colors`}
                        >
                          ← Back
                        </button>
                        <h3 className="text-h4 font-semibold">Off-Chain Strategy Execution</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isStrategyActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className={`text-label ${colors.text.secondary}`}>
                          {isStrategyActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                    </div>
                    <p className={`text-body ${colors.text.tertiary}`}>
                      Execute your proprietary strategies across exchanges. Configure vault reactions to your signals without revealing strategy details.
                    </p>
                  </div>

                  {/* API Configuration */}
                  <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-6`}>
                    <h4 className="text-button font-medium mb-4">API Configuration</h4>
                    <div className="space-y-4">
                      <div>
                        <label className={`text-label ${colors.text.secondary} block mb-2 uppercase tracking-wide`}>
                          Strategy API Key
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={apiKey}
                            readOnly
                            placeholder="Generate an API key to get started"
                            className={`flex-1 px-3 py-2 border ${colors.border.default} rounded-lg ${colors.bg.secondary} ${colors.text.primary} text-body focus:outline-none`}
                          />
                          <button
                            onClick={generateApiKey}
                            className="px-4 py-2 bg-[#C9A36A] hover:bg-[#B8935F] text-white rounded-lg text-button font-medium transition-colors whitespace-nowrap"
                          >
                            {apiKey ? 'Regenerate' : 'Generate Key'}
                          </button>
                        </div>
                        <p className={`text-label ${colors.text.tertiary} mt-2 uppercase tracking-wide`}>
                          Use this key to send trading signals to our vault system via API
                        </p>
                      </div>

                      <div>
                        <label className={`text-label ${colors.text.secondary} block mb-2 uppercase tracking-wide`}>
                          Webhook Endpoint
                        </label>
                        <input
                          type="text"
                          value="https://api.prime.testnet.bitfrost.ai/v1/enterprise/signals"
                          readOnly
                          className={`w-full px-3 py-2 border ${colors.border.default} rounded-lg ${colors.bg.secondary} ${colors.text.primary} text-body focus:outline-none`}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* JSON Strategy Upload */}
                  <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-6`}>
                    <h4 className="text-button font-medium mb-4">Upload Strategy Configuration</h4>
                    <p className={`text-body ${colors.text.tertiary} mb-4`}>
                      Upload a JSON file containing your custom strategy parameters. The file should include your trading logic, risk management settings, and execution parameters.
                    </p>
                    
                    <div className="space-y-4">
                      {/* File Upload */}
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".json"
                          onChange={handleStrategyFileUpload}
                          className="hidden"
                          id="strategy-file-upload"
                        />
                        <label
                          htmlFor="strategy-file-upload"
                          className={`flex items-center justify-center gap-3 px-4 py-4 border-2 border-dashed ${
                            uploadedStrategyFile ? 'border-[#C9A36A]' : colors.border.default
                          } rounded-lg cursor-pointer hover:border-[#C9A36A] transition-colors ${colors.bg.secondary}`}
                        >
                          <svg className={`w-5 h-5 ${uploadedStrategyFile ? 'text-[#C9A36A]' : colors.text.tertiary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <div className="text-center">
                            <span className={`text-button font-medium ${uploadedStrategyFile ? 'text-[#C9A36A]' : colors.text.primary}`}>
                              {uploadedStrategyFile ? uploadedStrategyFile.name : 'Click to upload strategy JSON'}
                            </span>
                            {!uploadedStrategyFile && (
                              <span className={`block text-label ${colors.text.tertiary} mt-1`}>
                                or drag and drop
                              </span>
                            )}
                          </div>
                        </label>
                        
                        {strategyUploadError && (
                          <div className="mt-2 px-3 py-2 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
                            <p className="text-label text-red-500">{strategyUploadError}</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Strategy Preview */}
                      {uploadedStrategyData && (
                        <div className={`${colors.bg.secondary} border ${colors.border.default} rounded-lg p-4`}>
                          <div className="flex items-center justify-between mb-3">
                            <h5 className={`text-button font-medium ${colors.text.primary}`}>Strategy Overview</h5>
                            <button
                              onClick={handleClearStrategy}
                              className={`text-label ${colors.text.tertiary} hover:text-red-500 transition-colors`}
                            >
                              Clear
                            </button>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <div className={`text-label ${colors.text.tertiary} mb-1 uppercase tracking-wide`}>Strategy Name</div>
                              <div className={`text-body font-medium ${colors.text.primary}`}>{uploadedStrategyData.strategyName}</div>
                            </div>
                            
                            {uploadedStrategyData.description && (
                              <div>
                                <div className={`text-label ${colors.text.tertiary} mb-1 uppercase tracking-wide`}>Description</div>
                                <div className={`text-body ${colors.text.secondary}`}>{uploadedStrategyData.description}</div>
                              </div>
                            )}
                            
                            <div>
                              <div className={`text-label ${colors.text.tertiary} mb-1 uppercase tracking-wide`}>Parameters Detected</div>
                              <div className={`text-body ${colors.text.secondary}`}>
                                {Object.keys(uploadedStrategyData.parameters || {}).length} parameter(s) configured
                              </div>
                            </div>
                            
                            {/* Parameters Preview */}
                            <div className="mt-3">
                              <details className="group">
                                <summary className={`cursor-pointer text-label ${colors.text.secondary} hover:text-[#C9A36A] transition-colors uppercase tracking-wide flex items-center gap-2`}>
                                  <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                  View Full Configuration
                                </summary>
                                <pre className={`mt-2 p-3 ${colors.bg.surface} border ${colors.border.default} rounded text-label ${colors.text.tertiary} overflow-x-auto`}>
                                  {JSON.stringify(uploadedStrategyData, null, 2)}
                                </pre>
                              </details>
                            </div>
                            
                            {/* Deploy Button */}
                            <div className="pt-3 border-t ${colors.border.default}">
                              {isStrategyDeployed ? (
                                <div className="flex items-center gap-2 px-4 py-3 bg-green-500 bg-opacity-10 border border-green-500 rounded-lg">
                                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                  <span className="text-button font-medium text-green-500">Strategy Deployed</span>
                                </div>
                              ) : (
                                <button
                                  onClick={handleDeployStrategy}
                                  className="w-full px-4 py-3 bg-[#C9A36A] hover:bg-[#B8935F] text-white rounded-lg text-button font-medium transition-colors"
                                >
                                  Deploy Strategy
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Example Format */}
                      {!uploadedStrategyData && (
                        <div className={`${colors.bg.secondary} border ${colors.border.default} rounded-lg p-4`}>
                          <h5 className={`text-label ${colors.text.secondary} mb-2 uppercase tracking-wide`}>Expected JSON Format</h5>
                          <pre className={`text-label ${colors.text.tertiary} overflow-x-auto`}>
{`{
  "strategyName": "My Custom Strategy",
  "description": "Strategy description",
  "parameters": {
    "maxPositionSize": 100000,
    "riskLimit": 5,
    "minSpread": 0.001,
    "orderSize": 1000,
    "rebalanceInterval": 60
  }
}`}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-6`}>
                  <button
                    onClick={() => setSelectedEnterpriseFeature(null)}
                    className={`text-label ${colors.text.secondary} hover:${colors.text.primary} transition-colors mb-4`}
                  >
                    ← Back
                  </button>
                  <h3 className="text-h4 font-semibold mb-4">
                    {selectedEnterpriseFeature === 'analytics' && 'Advanced Analytics'}
                    {selectedEnterpriseFeature === 'support' && 'Vault Management'}
                    {selectedEnterpriseFeature === 'api' && 'Vault Creation'}
                  </h3>
                  
                  {selectedEnterpriseFeature === 'support' ? (
                    <div className="space-y-6">
                      {/* Vault Overview */}
                      <div className={`${colors.bg.secondary} border ${colors.border.default} rounded-lg p-6`}>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className={`text-button font-medium ${colors.text.primary}`}>Velar Alpha Strategy</h4>
                            <div className={`text-label ${colors.text.tertiary} mt-1`}>
                              {currentVaultPrivacy === 'public' ? 'Public Vault' : 'Private Vault'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className={`text-label ${colors.text.secondary} uppercase tracking-wide`}>Active</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className={`text-label ${colors.text.tertiary} mb-1 uppercase tracking-wide`}>Total TVL</div>
                            <div className={`text-h4 font-semibold ${colors.text.primary}`}>
                              ${(creatorDeposit + userDeposits).toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className={`text-label ${colors.text.tertiary} mb-1 uppercase tracking-wide`}>Your Deposit</div>
                            <div className={`text-h4 font-semibold ${colors.text.primary}`}>
                              ${creatorDeposit.toLocaleString()}
                            </div>
                            <div className={`text-label ${colors.text.tertiary} mt-1`}>
                              {((creatorDeposit / (creatorDeposit + userDeposits)) * 100).toFixed(1)}% of TVL
                            </div>
                          </div>
                          <div>
                            <div className={`text-label ${colors.text.tertiary} mb-1 uppercase tracking-wide`}>Vault PnL</div>
                            <div className={`text-h4 font-semibold ${vaultPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {vaultPnl >= 0 ? '+' : ''}{vaultPnl}%
                            </div>
                          </div>
                          <div>
                            <div className={`text-label ${colors.text.tertiary} mb-1 uppercase tracking-wide`}>Your Earnings</div>
                            <div className={`text-h4 font-semibold text-[#C9A36A]`}>
                              ${accumulatedProfits.toLocaleString()}
                            </div>
                            <div className={`text-label ${colors.text.tertiary} mt-1`}>
                              Available to withdraw
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Deposit Funds */}
                      <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-6`}>
                        <h4 className={`text-button font-medium ${colors.text.primary} mb-4`}>Deposit Additional Funds</h4>
                        <p className={`text-body ${colors.text.secondary} mb-4`}>
                          Increase your deposit to maintain the 5% minimum TVL requirement as more users join.
                        </p>
                        
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <input
                              type="number"
                              value={managementDepositAmount}
                              onChange={(e) => setManagementDepositAmount(e.target.value)}
                              placeholder="Amount in USDC"
                              min="0"
                              step="10"
                              className={`w-full px-4 py-3 border ${colors.border.default} rounded-lg ${colors.bg.secondary} ${colors.text.primary} text-body focus:outline-none focus:ring-2 focus:ring-[#C9A36A]`}
                            />
                          </div>
                          <button
                            onClick={handleVaultDeposit}
                            disabled={!managementDepositAmount || parseFloat(managementDepositAmount) <= 0}
                            className={`px-6 py-3 rounded-lg text-button font-medium transition-colors whitespace-nowrap ${
                              managementDepositAmount && parseFloat(managementDepositAmount) > 0
                                ? 'bg-[#C9A36A] hover:bg-[#B8935F] text-white'
                                : `${colors.bg.secondary} ${colors.text.tertiary} cursor-not-allowed`
                            }`}
                          >
                            Deposit
                          </button>
                        </div>
                        
                        <div className={`mt-3 ${colors.bg.secondary} border ${colors.border.default} rounded-lg p-3`}>
                          <div className="flex justify-between items-center">
                            <span className={`text-label ${colors.text.tertiary}`}>Minimum Required (5% of TVL):</span>
                            <span className={`text-body font-medium ${colors.text.primary}`}>
                              ${((creatorDeposit + userDeposits) * 0.05).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Withdraw Funds */}
                      <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-6`}>
                        <h4 className={`text-button font-medium ${colors.text.primary} mb-4`}>Withdraw Your Deposit</h4>
                        <p className={`text-body ${colors.text.secondary} mb-4`}>
                          Withdraw your deposited capital while maintaining the 5% minimum TVL commitment.
                        </p>
                        
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <input
                              type="number"
                              value={managementWithdrawAmount}
                              onChange={(e) => setManagementWithdrawAmount(e.target.value)}
                              placeholder="Amount in USDC"
                              min="0"
                              step="10"
                              max={creatorDeposit - ((creatorDeposit + userDeposits) * 0.05)}
                              className={`w-full px-4 py-3 border ${colors.border.default} rounded-lg ${colors.bg.secondary} ${colors.text.primary} text-body focus:outline-none focus:ring-2 focus:ring-[#C9A36A]`}
                            />
                          </div>
                          <button
                            onClick={handleVaultWithdraw}
                            disabled={
                              !managementWithdrawAmount || 
                              parseFloat(managementWithdrawAmount) <= 0 ||
                              (creatorDeposit - parseFloat(managementWithdrawAmount)) < ((creatorDeposit + userDeposits) * 0.05)
                            }
                            className={`px-6 py-3 rounded-lg text-button font-medium transition-colors whitespace-nowrap ${
                              managementWithdrawAmount && 
                              parseFloat(managementWithdrawAmount) > 0 &&
                              (creatorDeposit - parseFloat(managementWithdrawAmount)) >= ((creatorDeposit + userDeposits) * 0.05)
                                ? 'bg-[#C9A36A] hover:bg-[#B8935F] text-white'
                                : `${colors.bg.secondary} ${colors.text.tertiary} cursor-not-allowed`
                            }`}
                          >
                            Withdraw
                          </button>
                        </div>
                        
                        <div className={`mt-3 ${colors.bg.secondary} border ${colors.border.default} rounded-lg p-3`}>
                          <div className="flex justify-between items-center">
                            <span className={`text-label ${colors.text.tertiary}`}>Maximum Withdrawable:</span>
                            <span className={`text-body font-medium ${colors.text.primary}`}>
                              ${Math.max(0, creatorDeposit - ((creatorDeposit + userDeposits) * 0.05)).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Take Profit */}
                      <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-6`}>
                        <h4 className={`text-button font-medium ${colors.text.primary} mb-4`}>Claim Your Earnings</h4>
                        <p className={`text-body ${colors.text.secondary} mb-4`}>
                          Withdraw your accumulated 10% performance fees from vault profits.
                        </p>
                        
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <input
                              type="number"
                              value={takeProfitAmount}
                              onChange={(e) => setTakeProfitAmount(e.target.value)}
                              placeholder="Amount in USDC"
                              min="0"
                              step="10"
                              max={accumulatedProfits}
                              className={`w-full px-4 py-3 border ${colors.border.default} rounded-lg ${colors.bg.secondary} ${colors.text.primary} text-body focus:outline-none focus:ring-2 focus:ring-[#C9A36A]`}
                            />
                          </div>
                          <button
                            onClick={handleTakeProfit}
                            disabled={
                              !takeProfitAmount || 
                              parseFloat(takeProfitAmount) <= 0 ||
                              parseFloat(takeProfitAmount) > accumulatedProfits
                            }
                            className={`px-6 py-3 rounded-lg text-button font-medium transition-colors whitespace-nowrap ${
                              takeProfitAmount && 
                              parseFloat(takeProfitAmount) > 0 &&
                              parseFloat(takeProfitAmount) <= accumulatedProfits
                                ? 'bg-[#C9A36A] hover:bg-[#B8935F] text-white'
                                : `${colors.bg.secondary} ${colors.text.tertiary} cursor-not-allowed`
                            }`}
                          >
                            Claim
                          </button>
                        </div>
                        
                        <div className={`mt-3 ${colors.bg.secondary} border ${colors.border.default} rounded-lg p-3`}>
                          <div className="flex justify-between items-center mb-2">
                            <span className={`text-label ${colors.text.tertiary}`}>Available Earnings:</span>
                            <span className={`text-body font-medium text-[#C9A36A]`}>
                              ${accumulatedProfits.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className={`text-label ${colors.text.tertiary}`}>Total Vault Profits Generated:</span>
                            <span className={`text-label ${colors.text.secondary}`}>
                              ${(accumulatedProfits * 10).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Vault Performance */}
                      <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-6`}>
                        <h4 className={`text-button font-medium ${colors.text.primary} mb-4`}>Performance Metrics</h4>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className={`text-body ${colors.text.secondary}`}>Total User Deposits:</span>
                            <span className={`text-body font-medium ${colors.text.primary}`}>
                              ${userDeposits.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className={`text-body ${colors.text.secondary}`}>Number of Users:</span>
                            <span className={`text-body font-medium ${colors.text.primary}`}>
                              127
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className={`text-body ${colors.text.secondary}`}>Average User Deposit:</span>
                            <span className={`text-body font-medium ${colors.text.primary}`}>
                              ${(userDeposits / 127).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                          <div className={`border-t ${colors.border.default} pt-3 mt-3`}>
                            <div className="flex justify-between items-center">
                              <span className={`text-body ${colors.text.secondary}`}>Total Fees Earned (All Time):</span>
                              <span className={`text-body font-medium text-[#C9A36A]`}>
                                ${(accumulatedProfits + 1250).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Vault Controls */}
                      <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-6`}>
                        <h4 className={`text-button font-medium ${colors.text.primary} mb-4`}>Vault Controls</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <button
                            onClick={() => setCurrentVaultPrivacy(prev => prev === 'public' ? 'private' : 'public')}
                            className={`px-4 py-3 border ${colors.border.default} ${colors.bg.secondary} ${colors.text.primary} rounded-lg text-button font-medium hover:border-[#C9A36A] transition-colors`}
                          >
                            {currentVaultPrivacy === 'public' ? 'Make Private' : 'Make Public'}
                          </button>
                          <button
                            className={`px-4 py-3 border ${colors.border.default} ${colors.bg.secondary} ${colors.text.primary} rounded-lg text-button font-medium hover:border-[#C9A36A] transition-colors`}
                          >
                            Pause Deposits
                          </button>
                          <button
                            className={`px-4 py-3 border ${colors.border.default} ${colors.bg.secondary} ${colors.text.primary} rounded-lg text-button font-medium hover:border-[#C9A36A] transition-colors`}
                          >
                            Update Strategy
                          </button>
                          <button
                            className={`px-4 py-3 border ${colors.border.default} ${colors.bg.secondary} ${colors.text.primary} rounded-lg text-button font-medium hover:border-[#C9A36A] transition-colors`}
                          >
                            View Transactions
                          </button>
                          <button
                            className={`px-4 py-3 border ${colors.border.default} ${colors.bg.secondary} ${colors.text.primary} rounded-lg text-button font-medium hover:border-[#C9A36A] transition-colors`}
                          >
                            Export Report
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : selectedEnterpriseFeature === 'api' ? (
                    <div className="space-y-6">
                      <div>
                        <h4 className={`text-button font-medium ${colors.text.primary} mb-3`}>How Vault Creation Works</h4>
                        <p className={`text-body ${colors.text.secondary} mb-4`}>
                          Create your own vaults to leverage deposited user capital for executing your market making strategies. This creates a win-win-win ecosystem:
                        </p>
                        <ul className={`space-y-2 text-body ${colors.text.secondary}`}>
                          <li className="flex items-start gap-2">
                            <span className="text-[#C9A36A] mt-1">•</span>
                            <span><strong className={colors.text.primary}>Market Makers</strong> benefit from increased inventory to execute larger strategies</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-[#C9A36A] mt-1">•</span>
                            <span><strong className={colors.text.primary}>Users</strong> earn yield from professional MM strategies without the complexity</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-[#C9A36A] mt-1">•</span>
                            <span><strong className={colors.text.primary}>Protocols</strong> benefit from deeper liquidity pools and tighter spreads</span>
                          </li>
                        </ul>
                      </div>

                      <div className={`${colors.bg.secondary} border ${colors.border.default} rounded-lg p-5`}>
                        <h4 className={`text-button font-medium ${colors.text.primary} mb-4`}>Vault Requirements</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className={`text-label ${colors.text.tertiary} mb-1 uppercase tracking-wide`}>Minimum Initial Deposit</div>
                            <div className={`text-h4 font-semibold ${colors.text.primary}`}>$100 USDC</div>
                            <p className={`text-label ${colors.text.tertiary} mt-1`}>Required to initialize your vault</p>
                          </div>
                          <div>
                            <div className={`text-label ${colors.text.tertiary} mb-1 uppercase tracking-wide`}>Creator Earnings</div>
                            <div className={`text-h4 font-semibold text-[#C9A36A]`}>10% of PnL</div>
                            <p className={`text-label ${colors.text.tertiary} mt-1`}>Performance fee on profits generated</p>
                          </div>
                          <div>
                            <div className={`text-label ${colors.text.tertiary} mb-1 uppercase tracking-wide`}>Minimum TVL Commitment</div>
                            <div className={`text-h4 font-semibold ${colors.text.primary}`}>5% of TVL</div>
                            <p className={`text-label ${colors.text.tertiary} mt-1`}>You must maintain this percentage</p>
                          </div>
                          <div>
                            <div className={`text-label ${colors.text.tertiary} mb-1 uppercase tracking-wide`}>User Share</div>
                            <div className={`text-h4 font-semibold ${colors.text.primary}`}>90% of PnL</div>
                            <p className={`text-label ${colors.text.tertiary} mt-1`}>Distributed to depositors</p>
                          </div>
                        </div>
                      </div>

                      <div className={`${colors.bg.secondary} border ${colors.border.default} rounded-lg p-5`}>
                        <h4 className={`text-button font-medium ${colors.text.primary} mb-3`}>Example</h4>
                        <p className={`text-body ${colors.text.secondary} mb-3`}>
                          If your vault has $10,000 TVL and generates $1,000 profit:
                        </p>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className={`text-body ${colors.text.secondary}`}>You earn (10%):</span>
                            <span className={`text-body font-medium ${colors.text.primary}`}>$100</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className={`text-body ${colors.text.secondary}`}>Users earn (90%):</span>
                            <span className={`text-body font-medium ${colors.text.primary}`}>$900</span>
                          </div>
                          <div className={`border-t ${colors.border.default} pt-2 mt-2`}>
                            <div className="flex justify-between items-center">
                              <span className={`text-body ${colors.text.secondary}`}>Your minimum required capital (5% of TVL):</span>
                              <span className={`text-body font-medium ${colors.text.primary}`}>$500</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowVaultCreationModal(true)}
                        className="w-full px-6 py-3 bg-[#C9A36A] hover:bg-[#B8935F] text-white rounded-lg text-button font-medium transition-colors"
                      >
                        Create Vault
                      </button>
                    </div>
                  ) : (
                    <p className={`text-body ${colors.text.secondary}`}>
                      This feature is coming soon.
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        )}
      </div>
      
      {/* Vault Creation Modal */}
      {showVaultCreationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${colors.bg.surface} rounded-lg max-w-lg w-full p-6 border ${colors.border.default}`}>
            {vaultCreationStep === 'name' && (
              <>
                <h3 className={`text-h3 font-semibold ${colors.text.primary} mb-4`}>Create Your Vault</h3>
                <p className={`text-body ${colors.text.secondary} mb-6`}>
                  Choose a unique name for your vault and set its privacy level.
                </p>
                
                <div className="mb-6">
                  <label className={`text-label ${colors.text.secondary} block mb-2 uppercase tracking-wide`}>
                    Vault Name
                  </label>
                  <input
                    type="text"
                    value={newVaultName}
                    onChange={(e) => setNewVaultName(e.target.value)}
                    placeholder="e.g., Velar Alpha Strategy"
                    className={`w-full px-4 py-3 border ${colors.border.default} rounded-lg ${colors.bg.secondary} ${colors.text.primary} text-body focus:outline-none focus:ring-2 focus:ring-[#C9A36A]`}
                    autoFocus
                  />
                </div>
                
                <div className="mb-6">
                  <label className={`text-label ${colors.text.secondary} block mb-3 uppercase tracking-wide`}>
                    Vault Privacy
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setVaultPrivacy('public')}
                      className={`p-4 border ${vaultPrivacy === 'public' ? 'border-[#C9A36A] bg-[#C9A36A] bg-opacity-10' : colors.border.default} rounded-lg transition-all text-left ${colors.bg.secondary}`}
                    >
                      <div className={`text-button font-medium ${vaultPrivacy === 'public' ? 'text-[#C9A36A]' : colors.text.primary} mb-1`}>
                        Public
                      </div>
                      <p className={`text-label ${colors.text.tertiary}`}>
                        Anyone can view and deposit
                      </p>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setVaultPrivacy('private')}
                      className={`p-4 border ${vaultPrivacy === 'private' ? 'border-[#C9A36A] bg-[#C9A36A] bg-opacity-10' : colors.border.default} rounded-lg transition-all text-left ${colors.bg.secondary}`}
                    >
                      <div className={`text-button font-medium ${vaultPrivacy === 'private' ? 'text-[#C9A36A]' : colors.text.primary} mb-1`}>
                        Private
                      </div>
                      <p className={`text-label ${colors.text.tertiary}`}>
                        Invite-only access
                      </p>
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={resetVaultCreation}
                    className={`flex-1 px-4 py-3 border ${colors.border.default} ${colors.bg.secondary} ${colors.text.secondary} rounded-lg text-button font-medium hover:${colors.border.hover} transition-colors`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setVaultCreationStep('deposit')}
                    disabled={!newVaultName.trim()}
                    className={`flex-1 px-4 py-3 rounded-lg text-button font-medium transition-colors ${
                      newVaultName.trim()
                        ? 'bg-[#C9A36A] hover:bg-[#B8935F] text-white'
                        : `${colors.bg.secondary} ${colors.text.tertiary} cursor-not-allowed`
                    }`}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
            
            {vaultCreationStep === 'deposit' && (
              <>
                <h3 className={`text-h3 font-semibold ${colors.text.primary} mb-4`}>Initial Deposit</h3>
                <p className={`text-body ${colors.text.secondary} mb-6`}>
                  Deposit the minimum required capital to initialize your vault. You must maintain at least 5% of total TVL.
                </p>
                
                <div className="mb-6">
                  <label className={`text-label ${colors.text.secondary} block mb-2 uppercase tracking-wide`}>
                    Deposit Amount (USDC)
                  </label>
                  <input
                    type="number"
                    value={vaultDepositAmount}
                    onChange={(e) => setVaultDepositAmount(e.target.value)}
                    min="100"
                    step="10"
                    className={`w-full px-4 py-3 border ${colors.border.default} rounded-lg ${colors.bg.secondary} ${colors.text.primary} text-body focus:outline-none focus:ring-2 focus:ring-[#C9A36A]`}
                  />
                  <p className={`text-label ${colors.text.tertiary} mt-2`}>
                    Minimum: $100 USDC
                  </p>
                </div>
                
                <div className={`${colors.bg.secondary} border ${colors.border.default} rounded-lg p-4 mb-6`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-body ${colors.text.secondary}`}>Initial deposit:</span>
                    <span className={`text-body font-medium ${colors.text.primary}`}>${vaultDepositAmount} USDC</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-body ${colors.text.secondary}`}>Your share:</span>
                    <span className={`text-body font-medium text-[#C9A36A]`}>100% of TVL</span>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setVaultCreationStep('name')}
                    className={`flex-1 px-4 py-3 border ${colors.border.default} ${colors.bg.secondary} ${colors.text.secondary} rounded-lg text-button font-medium hover:${colors.border.hover} transition-colors`}
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setVaultCreationStep('confirm')}
                    disabled={parseFloat(vaultDepositAmount) < 100}
                    className={`flex-1 px-4 py-3 rounded-lg text-button font-medium transition-colors ${
                      parseFloat(vaultDepositAmount) >= 100
                        ? 'bg-[#C9A36A] hover:bg-[#B8935F] text-white'
                        : `${colors.bg.secondary} ${colors.text.tertiary} cursor-not-allowed`
                    }`}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
            
            {vaultCreationStep === 'confirm' && (
              <>
                <h3 className={`text-h3 font-semibold ${colors.text.primary} mb-4`}>Confirm Vault Creation</h3>
                <p className={`text-body ${colors.text.secondary} mb-6`}>
                  Review your vault details before finalizing.
                </p>
                
                <div className={`${colors.bg.secondary} border ${colors.border.default} rounded-lg p-5 mb-6 space-y-4`}>
                  <div>
                    <div className={`text-label ${colors.text.tertiary} mb-1 uppercase tracking-wide`}>Vault Name</div>
                    <div className={`text-body font-medium ${colors.text.primary}`}>{newVaultName}</div>
                  </div>
                  
                  <div className={`border-t ${colors.border.default} pt-4`}>
                    <div className={`text-label ${colors.text.tertiary} mb-1 uppercase tracking-wide`}>Privacy</div>
                    <div className={`text-body font-medium ${colors.text.primary} capitalize`}>
                      {vaultPrivacy}
                      <span className={`text-label ${colors.text.tertiary} ml-2`}>
                        ({vaultPrivacy === 'public' ? 'Anyone can deposit' : 'Invite-only'})
                      </span>
                    </div>
                  </div>
                  
                  <div className={`border-t ${colors.border.default} pt-4`}>
                    <div className={`text-label ${colors.text.tertiary} mb-1 uppercase tracking-wide`}>Initial Deposit</div>
                    <div className={`text-h4 font-semibold ${colors.text.primary}`}>${vaultDepositAmount} USDC</div>
                  </div>
                  
                  <div className={`border-t ${colors.border.default} pt-4`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-label ${colors.text.tertiary}`}>Your earnings:</span>
                      <span className={`text-body font-medium text-[#C9A36A]`}>10% of PnL</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-label ${colors.text.tertiary}`}>User earnings:</span>
                      <span className={`text-body font-medium ${colors.text.primary}`}>90% of PnL</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-label ${colors.text.tertiary}`}>Minimum commitment:</span>
                      <span className={`text-body font-medium ${colors.text.primary}`}>5% of TVL</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setVaultCreationStep('deposit')}
                    disabled={isCreatingVault}
                    className={`flex-1 px-4 py-3 border ${colors.border.default} ${colors.bg.secondary} ${colors.text.secondary} rounded-lg text-button font-medium hover:${colors.border.hover} transition-colors disabled:opacity-50`}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreateVault}
                    disabled={isCreatingVault}
                    className={`flex-1 px-4 py-3 bg-[#C9A36A] hover:bg-[#B8935F] text-white rounded-lg text-button font-medium transition-colors disabled:opacity-50`}
                  >
                    {isCreatingVault ? 'Creating...' : 'Create Vault'}
                  </button>
                </div>
              </>
            )}
            
            {vaultCreationStep === 'success' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className={`text-h3 font-semibold ${colors.text.primary} mb-2`}>Vault Created Successfully!</h3>
                  <p className={`text-body ${colors.text.secondary} mb-4`}>
                    Your vault "{newVaultName}" has been created and is now live.
                  </p>
                  
                  <div className={`${colors.bg.secondary} border ${colors.border.default} rounded-lg p-4 mb-6`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-label ${colors.text.tertiary}`}>Vault TVL:</span>
                      <span className={`text-body font-medium ${colors.text.primary}`}>${vaultDepositAmount} USDC</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-label ${colors.text.tertiary}`}>Status:</span>
                      <span className="text-body font-medium text-green-500">Active</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={resetVaultCreation}
                  className="w-full px-4 py-3 bg-[#C9A36A] hover:bg-[#B8935F] text-white rounded-lg text-button font-medium transition-colors"
                >
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Exchange Pair Selector */}
      {showExchangePairSelector && (
        <ExchangePairSelector
          mode="exchange"
          currentExchange={editingStrategyId ? strategies.find(s => s.id === editingStrategyId)?.exchange : selectedExchange}
          enabledExchanges={enabledExchanges}
          onSelect={(exchange, pair) => {
            if (editingStrategyId) {
              // Update the specific strategy being edited
              setStrategies(strategies.map(s => 
                s.id === editingStrategyId 
                  ? { ...s, exchange, pair }
                  : s
              ));
            } else {
              // Update the advanced tab fields
              setSelectedExchange(exchange);
              setSelectedPair(pair);
            }
          }}
          onClose={() => {
            setShowExchangePairSelector(false);
            setEditingStrategyId(null);
          }}
        />
      )}

      {/* Upload Strategy Configuration Modal */}
      {showUploadModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => {
            setShowUploadModal(false);
            setUploadingStrategyId(null);
          }}
        >
          <div 
            className={`${colors.bg.primary} rounded-lg shadow-xl w-full max-w-2xl mx-4`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`px-6 py-4 border-b ${colors.border.primary}`}>
              <h2 className={`text-h3 font-semibold ${colors.text.primary}`}>
                Upload Strategy Configuration
              </h2>
              <p className={`text-label ${colors.text.tertiary} mt-1`}>
                Upload a JSON file containing your custom strategy parameters. The file should include your trading logic, risk management settings, and execution parameters.
              </p>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              {/* Upload Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                  isDraggingOver 
                    ? `border-[#C9A36A] ${colors.bg.hover}` 
                    : `${colors.border.primary} hover:${colors.bg.hover}`
                }`}
              >
                <Upload className={`w-6 h-6 ${colors.text.tertiary} mx-auto mb-3`} />
                <p className={`text-button ${colors.text.primary} mb-1`}>
                  Click to upload strategy JSON
                </p>
                <p className={`text-label ${colors.text.tertiary}`}>
                  OR DRAG AND DROP
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleStrategyJsonUpload}
                />
              </div>

              {/* Expected JSON Format */}
              <div className="mt-6">
                <p className={`text-label ${colors.text.tertiary} mb-2 uppercase tracking-wide`}>
                  Expected JSON Format
                </p>
                <div className={`${colors.bg.secondary} rounded-lg p-4 font-mono text-xs ${colors.text.tertiary}`}>
                  <pre className="overflow-x-auto">
{`{
  "STRATEGYNAME": "MY CUSTOM STRATEGY",
  "DESCRIPTION": "STRATEGY DESCRIPTION",
  "PARAMETERS": {
    "MAXPOSITIONSIZE": 100000,
    "RISKLIMIT": 5,
    "MINSPREAD": 0.001,
    "ORDERSIZE": 1000,
    "REBALANCEINTERVAL": 60
  }
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Results Modal */}
      {showSimulationModal && simulationResults && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowSimulationModal(false)}
        >
          <div 
            className={`${colors.bg.primary} rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`px-6 py-4 border-b ${colors.border.primary}`}>
              <h2 className={`text-h3 font-semibold ${colors.text.primary}`}>
                Multi-Strategy Simulation Results
              </h2>
              <p className={`text-label ${colors.text.tertiary} mt-1`}>
                Projected performance analysis for {strategies.length} configured {strategies.length === 1 ? 'strategy' : 'strategies'}
              </p>
            </div>

            {/* Content */}
            <div className="px-6 py-6 overflow-y-auto flex-1">
              {/* Overall Performance */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-4`}>
                  <p className={`text-label ${colors.text.tertiary} uppercase tracking-wide mb-1`}>
                    Total PnL
                  </p>
                  <p className={`text-h2 font-semibold ${simulationResults.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${simulationResults.totalPnL.toFixed(2)}
                  </p>
                </div>
                <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-4`}>
                  <p className={`text-label ${colors.text.tertiary} uppercase tracking-wide mb-1`}>
                    Total Exposure
                  </p>
                  <p className={`text-h2 font-semibold ${colors.text.primary}`}>
                    ${simulationResults.totalExposure.toLocaleString()}
                  </p>
                </div>
                <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-4`}>
                  <p className={`text-label ${colors.text.tertiary} uppercase tracking-wide mb-1`}>
                    Overall ROI
                  </p>
                  <p className={`text-h2 font-semibold ${simulationResults.overallRoi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {simulationResults.overallRoi.toFixed(2)}%
                  </p>
                </div>
                <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-4`}>
                  <p className={`text-label ${colors.text.tertiary} uppercase tracking-wide mb-1`}>
                    Sharpe Ratio
                  </p>
                  <p className={`text-h2 font-semibold ${colors.text.primary}`}>
                    {simulationResults.riskMetrics.sharpeRatio.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Per-Strategy Results */}
              <div className="mb-6">
                <h3 className={`text-h4 font-semibold ${colors.text.primary} mb-3`}>
                  Per-Strategy Performance
                </h3>
                <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg overflow-hidden`}>
                  <table className="w-full">
                    <thead className={`${colors.bg.secondary} border-b ${colors.border.default}`}>
                      <tr>
                        <th className={`px-4 py-3 text-left text-label ${colors.text.tertiary} uppercase tracking-wide`}>Strategy</th>
                        <th className={`px-4 py-3 text-left text-label ${colors.text.tertiary} uppercase tracking-wide`}>Exchange</th>
                        <th className={`px-4 py-3 text-left text-label ${colors.text.tertiary} uppercase tracking-wide`}>Pair</th>
                        <th className={`px-4 py-3 text-right text-label ${colors.text.tertiary} uppercase tracking-wide`}>Exposure</th>
                        <th className={`px-4 py-3 text-right text-label ${colors.text.tertiary} uppercase tracking-wide`}>PnL</th>
                        <th className={`px-4 py-3 text-right text-label ${colors.text.tertiary} uppercase tracking-wide`}>ROI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simulationResults.strategyResults.map((result: any, index: number) => (
                        <tr key={index} className={`border-b ${colors.border.default} last:border-b-0`}>
                          <td className={`px-4 py-3 text-body ${colors.text.primary}`}>{result.name}</td>
                          <td className={`px-4 py-3 text-body ${colors.text.secondary}`}>{result.exchange}</td>
                          <td className={`px-4 py-3 text-body ${colors.text.secondary}`}>{result.pair}</td>
                          <td className={`px-4 py-3 text-body ${colors.text.primary} text-right`}>
                            ${result.exposure.toLocaleString()}
                          </td>
                          <td className={`px-4 py-3 text-body text-right ${result.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            ${result.pnl.toFixed(2)}
                          </td>
                          <td className={`px-4 py-3 text-body text-right ${result.roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {result.roi.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Per-Exchange Analysis */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className={`text-h4 font-semibold ${colors.text.primary} mb-3`}>
                    Exchange Exposure
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(simulationResults.exchangeExposure).map(([exchange, exposure]: [string, any]) => (
                      <div key={exchange} className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-3`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-body ${colors.text.primary}`}>{exchange}</span>
                          <span className={`text-body font-semibold ${colors.text.primary}`}>
                            ${exposure.toLocaleString()}
                          </span>
                        </div>
                        <div className={`mt-2 h-2 ${colors.bg.secondary} rounded-full overflow-hidden`}>
                          <div 
                            className="h-full bg-[#C9A36A]"
                            style={{ width: `${(exposure / simulationResults.totalExposure) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className={`text-h4 font-semibold ${colors.text.primary} mb-3`}>
                    Exchange PnL
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(simulationResults.exchangePnL).map(([exchange, pnl]: [string, any]) => (
                      <div key={exchange} className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-3`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-body ${colors.text.primary}`}>{exchange}</span>
                          <span className={`text-body font-semibold ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            ${pnl.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Risk Metrics & Correlations */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className={`text-h4 font-semibold ${colors.text.primary} mb-3`}>
                    Risk Metrics
                  </h3>
                  <div className="space-y-2">
                    <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-3 flex items-center justify-between`}>
                      <span className={`text-body ${colors.text.secondary}`}>Max Drawdown</span>
                      <span className={`text-body font-semibold text-red-500`}>
                        {simulationResults.riskMetrics.maxDrawdown.toFixed(2)}%
                      </span>
                    </div>
                    <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-3 flex items-center justify-between`}>
                      <span className={`text-body ${colors.text.secondary}`}>Diversification Benefit</span>
                      <span className={`text-body font-semibold text-green-500`}>
                        +{simulationResults.riskMetrics.diversificationBenefit.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {Object.keys(simulationResults.correlations).length > 0 && (
                  <div>
                    <h3 className={`text-h4 font-semibold ${colors.text.primary} mb-3`}>
                      Strategy Interactions
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(simulationResults.correlations).map(([exchange, correlation]: [string, any]) => (
                        <div key={exchange} className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-3`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-body ${colors.text.secondary}`}>{exchange} Pairs</span>
                            <span className={`text-body font-semibold ${colors.text.primary}`}>
                              {(correlation * 100).toFixed(0)}% correlated
                            </span>
                          </div>
                          <p className={`text-label ${colors.text.tertiary}`}>
                            Multiple strategies on same exchange may have {correlation > 0.5 ? 'high' : 'moderate'} correlation
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className={`px-6 py-4 border-t ${colors.border.primary} flex items-center justify-between`}>
              <p className={`text-label ${colors.text.tertiary}`}>
                Simulation based on historical data and current market conditions
              </p>
              <button
                onClick={() => setShowSimulationModal(false)}
                className="px-6 py-2.5 bg-[#C9A36A] hover:bg-[#B8935C] text-white rounded transition-colors text-button font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deploy All Strategies Confirmation Modal */}
      {showDeployConfirmation && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDeployConfirmation(false)}
        >
          <div 
            className={`${colors.bg.surface} rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`px-6 py-4 border-b ${colors.border.primary}`}>
              <h2 className={`text-h3 font-semibold ${colors.text.primary}`}>
                Confirm Strategy Deployment
              </h2>
              <p className={`text-label ${colors.text.tertiary} mt-1`}>
                Review your strategies before deployment
              </p>
            </div>

            {/* Content */}
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className={`${colors.bg.secondary} border ${colors.border.default} rounded-lg p-4`}>
                  <div className={`text-label ${colors.text.tertiary} mb-1`}>Total Strategies</div>
                  <div className={`text-h3 font-semibold ${colors.text.primary}`}>
                    {strategies.filter(s => s.exchange && s.pair && s.margin).length}
                  </div>
                </div>
                <div className={`${colors.bg.secondary} border ${colors.border.default} rounded-lg p-4`}>
                  <div className={`text-label ${colors.text.tertiary} mb-1`}>Total Margin</div>
                  <div className={`text-h3 font-semibold ${colors.text.primary}`}>
                    ${strategies.reduce((sum, s) => sum + (parseFloat(s.margin) || 0), 0).toLocaleString()}
                  </div>
                </div>
                <div className={`${colors.bg.secondary} border ${colors.border.default} rounded-lg p-4`}>
                  <div className={`text-label ${colors.text.tertiary} mb-1`}>Total Exposure</div>
                  <div className={`text-h3 font-semibold ${colors.text.primary}`}>
                    ${strategies.reduce((sum, s) => sum + ((parseFloat(s.margin) || 0) * (parseFloat(s.leverage) || 1)), 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Strategy Details with Accordion */}
              <h3 className={`text-body font-semibold ${colors.text.primary} mb-3`}>
                Strategy Details
              </h3>
              <div className="space-y-3">
                {strategies.filter(s => s.exchange && s.pair && s.margin).map((strategy, index) => {
                  const marginNum = parseFloat(strategy.margin) || 0;
                  const leverageNum = parseFloat(strategy.leverage) || 1;
                  const exposure = marginNum * leverageNum;
                  const isExpanded = expandedStrategies.has(strategy.id);
                  const estimates = calculateStrategyEstimates(strategy);
                  
                  return (
                    <div 
                      key={strategy.id}
                      className={`${colors.bg.secondary} border ${colors.border.default} rounded-lg overflow-hidden`}
                    >
                      {/* Accordion Header - Always Visible */}
                      <button
                        onClick={() => toggleStrategyExpansion(strategy.id)}
                        className={`w-full p-4 ${colors.state.hover} transition-colors text-left`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`text-body font-semibold ${colors.text.primary}`}>
                                {strategy.name}
                              </div>
                              <div className={`px-2 py-0.5 ${colors.bg.surface} border ${colors.border.default} rounded text-label ${colors.text.secondary}`}>
                                #{index + 1}
                              </div>
                            </div>
                            <div className={`text-label ${colors.text.tertiary} mb-3`}>
                              {strategy.exchange} • {strategy.pair}
                            </div>
                            
                            {/* Quick Summary - Always Visible */}
                            <div className="grid grid-cols-4 gap-4">
                              <div>
                                <div className={`text-label ${colors.text.tertiary}`}>Margin</div>
                                <div className={`text-body font-medium ${colors.text.primary}`}>
                                  ${marginNum.toLocaleString()}
                                </div>
                              </div>
                              <div>
                                <div className={`text-label ${colors.text.tertiary}`}>Leverage</div>
                                <div className={`text-body font-medium ${colors.text.primary}`}>
                                  {leverageNum}x
                                </div>
                              </div>
                              <div>
                                <div className={`text-label ${colors.text.tertiary}`}>Daily Est.</div>
                                <div className={`text-body font-medium text-green-500`}>
                                  +${estimates.dailyReturn.toFixed(2)}
                                </div>
                              </div>
                              <div>
                                <div className={`text-label ${colors.text.tertiary}`}>Daily ROI</div>
                                <div className={`text-body font-medium text-green-500`}>
                                  +{estimates.dailyReturnPercent.toFixed(2)}%
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="ml-4">
                            <ChevronDown 
                              className={`w-5 h-5 ${colors.text.tertiary} transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            />
                          </div>
                        </div>
                      </button>
                      
                      {/* Accordion Content - Expandable */}
                      {isExpanded && (
                        <div className={`px-4 pb-4 border-t ${colors.border.secondary}`}>
                          {/* Configuration Details */}
                          <div className="mt-4">
                            <h4 className={`text-button font-semibold ${colors.text.primary} mb-3`}>
                              Configuration
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div>
                                <div className={`text-label ${colors.text.tertiary}`}>Exposure</div>
                                <div className={`text-body font-medium ${colors.text.primary}`}>
                                  ${exposure.toLocaleString()}
                                </div>
                              </div>
                              <div>
                                <div className={`text-label ${colors.text.tertiary}`}>Spread</div>
                                <div className={`text-body font-medium ${colors.text.primary}`}>
                                  {strategy.spreadBps} bps
                                </div>
                              </div>
                              <div>
                                <div className={`text-label ${colors.text.tertiary}`}>Order Levels</div>
                                <div className={`text-body font-medium ${colors.text.primary}`}>
                                  {strategy.orderLevels}
                                </div>
                              </div>
                              <div>
                                <div className={`text-label ${colors.text.tertiary}`}>Order Amount</div>
                                <div className={`text-body font-medium ${colors.text.primary}`}>
                                  ${parseFloat(strategy.orderAmount).toLocaleString()}
                                </div>
                              </div>
                              <div>
                                <div className={`text-label ${colors.text.tertiary}`}>Refresh Time</div>
                                <div className={`text-body font-medium ${colors.text.primary}`}>
                                  {strategy.refreshTime}s
                                </div>
                              </div>
                              <div>
                                <div className={`text-label ${colors.text.tertiary}`}>Inventory Skew</div>
                                <div className={`text-body font-medium ${colors.text.primary}`}>
                                  {strategy.inventorySkew}%
                                </div>
                              </div>
                              <div>
                                <div className={`text-label ${colors.text.tertiary}`}>Min Spread</div>
                                <div className={`text-body font-medium ${colors.text.primary}`}>
                                  {strategy.minSpread} bps
                                </div>
                              </div>
                              <div>
                                <div className={`text-label ${colors.text.tertiary}`}>Max Spread</div>
                                <div className={`text-body font-medium ${colors.text.primary}`}>
                                  {strategy.maxSpread} bps
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Risk Management */}
                          <div className="mt-4">
                            <h4 className={`text-button font-semibold ${colors.text.primary} mb-3`}>
                              Risk Management
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div>
                                <div className={`text-label ${colors.text.tertiary}`}>Stop Loss</div>
                                <div className={`text-body font-medium text-red-500`}>
                                  -{strategy.stopLoss}%
                                </div>
                              </div>
                              <div>
                                <div className={`text-label ${colors.text.tertiary}`}>Take Profit</div>
                                <div className={`text-body font-medium text-green-500`}>
                                  +{strategy.takeProfit}%
                                </div>
                              </div>
                              <div>
                                <div className={`text-label ${colors.text.tertiary}`}>Participation</div>
                                <div className={`text-body font-medium ${colors.text.primary} capitalize`}>
                                  {strategy.participationRate}
                                </div>
                              </div>
                              <div>
                                <div className={`text-label ${colors.text.tertiary}`}>Auto-Repeat</div>
                                <div className={`text-body font-medium ${colors.text.primary}`}>
                                  {strategy.enableAutoRepeat ? `Yes (${strategy.maxRuns}x)` : 'No'}
                                </div>
                              </div>
                            </div>
                            {strategy.enablePnlTolerance && (
                              <div className={`mt-3 p-3 ${colors.bg.surface} border ${colors.border.default} rounded`}>
                                <div className={`text-label ${colors.text.secondary}`}>
                                  PnL Tolerance: Will only repeat if ending equity change is within ±{strategy.tolerancePercent}%
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Estimated Performance */}
                          <div className="mt-4">
                            <h4 className={`text-button font-semibold ${colors.text.primary} mb-3`}>
                              Estimated Performance
                            </h4>
                            
                            {/* Performance Metrics Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-3`}>
                                <div className={`text-label ${colors.text.tertiary} mb-1`}>Volume Per Run</div>
                                <div className={`text-h4 font-semibold ${colors.text.primary}`}>
                                  ${estimates.volumePerRun.toLocaleString()}
                                </div>
                              </div>
                              <div className={`${colors.bg.surface} border ${colors.border.default} rounded-lg p-3`}>
                                <div className={`text-label ${colors.text.tertiary} mb-1`}>Runs Per Day</div>
                                <div className={`text-h4 font-semibold ${colors.text.primary}`}>
                                  {estimates.actualRunsPerDay}
                                </div>
                              </div>
                            </div>

                            {/* Daily Estimates */}
                            <div className={`${colors.bg.surface} border-l-4 border-blue-500 rounded p-3 mb-3`}>
                              <div className={`text-button font-medium ${colors.text.primary} mb-2`}>
                                Daily Estimates
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <div className={`text-label ${colors.text.tertiary}`}>Daily Volume</div>
                                  <div className={`text-body font-semibold ${colors.text.primary}`}>
                                    ${estimates.dailyVolume.toLocaleString()}
                                  </div>
                                </div>
                                <div>
                                  <div className={`text-label ${colors.text.tertiary}`}>Maker Rebates</div>
                                  <div className={`text-body font-semibold text-green-500`}>
                                    +${estimates.makerFees.toFixed(2)}
                                  </div>
                                </div>
                                <div>
                                  <div className={`text-label ${colors.text.tertiary}`}>Spread Profit</div>
                                  <div className={`text-body font-semibold text-green-500`}>
                                    +${estimates.spreadProfit.toFixed(2)}
                                  </div>
                                </div>
                                <div>
                                  <div className={`text-label ${colors.text.tertiary}`}>Total Return</div>
                                  <div className={`text-body font-semibold text-green-500`}>
                                    +${estimates.dailyReturn.toFixed(2)} ({estimates.dailyReturnPercent.toFixed(2)}%)
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Monthly Projection */}
                            <div className={`${colors.bg.surface} border-l-4 border-[#C9A36A] rounded p-3`}>
                              <div className={`text-button font-medium ${colors.text.primary} mb-2`}>
                                30-Day Projection
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <div className={`text-label ${colors.text.tertiary}`}>Estimated Return</div>
                                  <div className={`text-h4 font-semibold text-green-500`}>
                                    +${estimates.monthlyReturn.toFixed(2)}
                                  </div>
                                </div>
                                <div>
                                  <div className={`text-label ${colors.text.tertiary}`}>ROI</div>
                                  <div className={`text-h4 font-semibold text-green-500`}>
                                    +{estimates.monthlyReturnPercent.toFixed(2)}%
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Performance Notes */}
                            <div className={`mt-3 p-3 ${colors.bg.subtle} rounded`}>
                              <div className={`text-label ${colors.text.tertiary}`}>
                                <strong>Note:</strong> Estimates based on {strategy.participationRate} participation rate 
                                ({estimates.actualRunsPerDay} runs/day), {strategy.spreadBps} bps spread capture (50% efficiency), 
                                and -0.01% maker rebates. Actual performance may vary based on market conditions.
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Warning */}
              <div className={`mt-6 p-4 ${colors.bg.secondary} border-l-4 border-yellow-500 rounded`}>
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className={`text-body font-medium ${colors.text.primary} mb-1`}>
                      Important Notice
                    </div>
                    <div className={`text-label ${colors.text.tertiary}`}>
                      Once deployed, these strategies will begin executing immediately on their respective exchanges. 
                      Ensure you have sufficient margin allocated and understand the risks involved.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={`px-6 py-4 border-t ${colors.border.primary} flex items-center justify-end gap-3`}>
              <button
                onClick={() => setShowDeployConfirmation(false)}
                className={`px-6 py-2.5 ${colors.bg.secondary} hover:${colors.bg.hover} border ${colors.border.default} rounded transition-colors text-button font-medium ${colors.text.primary}`}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeployAllStrategies}
                className="px-6 py-2.5 bg-[#C9A36A] hover:bg-[#B8935C] text-white rounded transition-colors text-button font-medium"
              >
                Confirm & Deploy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
