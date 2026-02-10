import { useState, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useThemeStore } from '../../stores/themeStore';
import { EnterpriseFormData } from './types';
import { Upload } from 'lucide-react';
import { FormField } from './FormField';

interface EnterpriseTabProps {
  form: UseFormReturn<EnterpriseFormData>;
  exchanges: string[];
  pairs: string[];
  isAuthenticated: boolean;
  onAuthenticate: () => void;
  onDeploy: () => void;
}

const ENTERPRISE_FEATURES = [
  { id: 'custom-strategy', name: 'Custom Strategy Upload', description: 'Upload and deploy your own algorithmic trading strategies' },
  { id: 'cross-exchange-arb', name: 'Cross-Exchange Arbitrage', description: 'Automated arbitrage across multiple exchanges' },
  { id: 'smart-routing', name: 'Smart Order Routing', description: 'Intelligent order routing to minimize slippage' },
  { id: 'risk-management', name: 'Advanced Risk Management', description: 'Portfolio-wide risk controls and monitoring' },
];

export function EnterpriseTab({
  form,
  exchanges,
  pairs,
  isAuthenticated,
  onAuthenticate,
  onDeploy,
}: EnterpriseTabProps) {
  const { colors } = useThemeStore();
  const { register, watch, setValue, formState: { errors } } = form;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedData, setUploadedData] = useState<any>(null);
  const [uploadError, setUploadError] = useState<string>('');
  const [isDeployed, setIsDeployed] = useState(false);

  const enterpriseCode = watch('enterpriseCode');
  const selectedFeature = watch('selectedFeature');
  const selectedExchanges = watch('selectedExchanges') || [];
  const selectedPairs = watch('selectedPairs') || [];
  const apiKey = watch('apiKey');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      setUploadError('Please upload a valid JSON file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        if (!jsonData.strategyName || !jsonData.parameters) {
          setUploadError('Invalid strategy format');
          return;
        }
        setUploadedFile(file);
        setUploadedData(jsonData);
        setUploadError('');
        setIsDeployed(false);
      } catch (error) {
        setUploadError('Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleDeploy = () => {
    if (!uploadedData) return;
    setIsDeployed(true);
    onDeploy();
  };

  const generateApiKey = () => {
    const key = 'ent_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setValue('apiKey', key);
  };

  const toggleExchange = (exchange: string) => {
    const current = selectedExchanges || [];
    const updated = current.includes(exchange)
      ? current.filter(e => e !== exchange)
      : [...current, exchange];
    setValue('selectedExchanges', updated);
  };

  const togglePair = (pair: string) => {
    const current = selectedPairs || [];
    const updated = current.includes(pair)
      ? current.filter(p => p !== pair)
      : [...current, pair];
    setValue('selectedPairs', updated);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className={`p-8 ${colors.bg.secondary} border ${colors.border.secondary} rounded-sm text-center`}>
          <h3 className="text-lg font-semibold mb-2">Enterprise Access</h3>
          <p className={`text-[13px] ${colors.text.tertiary} mb-6`}>
            Enter your enterprise access code to unlock advanced features
          </p>

          <div className="max-w-sm mx-auto">
            <FormField
              label="Enterprise Code"
              {...register('enterpriseCode')}
              error={errors.enterpriseCode?.message}
              placeholder="Enter code"
            />
            <button
              type="button"
              onClick={onAuthenticate}
              disabled={!enterpriseCode}
              className={`w-full mt-4 px-4 py-3 ${colors.bg.brand} ${colors.text.brandContrast} rounded-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50`}
            >
              Unlock Enterprise Features
            </button>
          </div>

          <div className={`mt-6 p-4 ${colors.bg.tertiary} rounded-sm text-left`}>
            <div className="text-[11px] font-medium mb-2">Enterprise Features Include:</div>
            <ul className={`text-[11px] ${colors.text.tertiary} space-y-1`}>
              {ENTERPRISE_FEATURES.map(feature => (
                <li key={feature.id}>• {feature.description}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px]">
      {/* Feature Selection */}
      <div className="mb-6">
        <h3 className="text-button font-medium mb-3">Select Enterprise Feature</h3>
        <div className="grid grid-cols-2 gap-3">
          {ENTERPRISE_FEATURES.map((feature) => (
            <button
              key={feature.id}
              type="button"
              onClick={() => setValue('selectedFeature', feature.id)}
              className={`p-4 text-left border rounded-sm transition-all ${
                selectedFeature === feature.id
                  ? `${colors.border.brand} ${colors.bg.brandSubtle}`
                  : `${colors.border.secondary} ${colors.bg.secondary} hover:${colors.border.primary}`
              }`}
            >
              <div className="font-medium text-button mb-1">{feature.name}</div>
              <div className={`text-[11px] ${colors.text.tertiary}`}>{feature.description}</div>
            </button>
          ))}
        </div>
      </div>

      {selectedFeature === 'custom-strategy' && (
        <div className="space-y-6">
          {/* Strategy Upload */}
          <div>
            <h3 className="text-button font-medium mb-3">Upload Strategy Configuration</h3>
            <div
              className={`relative p-8 border-2 border-dashed ${
                uploadedFile ? colors.border.brand : colors.border.secondary
              } rounded-sm text-center cursor-pointer hover:${colors.border.primary} transition-colors`}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className={`w-8 h-8 mx-auto mb-3 ${colors.text.tertiary}`} />
              <div className="text-button mb-1">
                {uploadedFile ? uploadedFile.name : 'Click to upload or drag and drop'}
              </div>
              <div className={`text-[11px] ${colors.text.tertiary}`}>
                JSON strategy configuration file
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            {uploadError && <p className="mt-2 text-[11px] text-red-500">{uploadError}</p>}
          </div>

          {uploadedData && (
            <div className={`p-4 ${colors.bg.secondary} border ${colors.border.secondary} rounded-sm`}>
              <div className="text-button font-medium mb-2">Strategy Details</div>
              <div className="space-y-1 text-[13px]">
                <div className="flex justify-between">
                  <span className={colors.text.tertiary}>Strategy Name</span>
                  <span className="font-medium">{uploadedData.strategyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className={colors.text.tertiary}>Parameters</span>
                  <span className="font-medium">{Object.keys(uploadedData.parameters || {}).length} configured</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDeploy}
                disabled={isDeployed}
                className={`w-full mt-4 px-4 py-3 ${colors.bg.brand} ${colors.text.brandContrast} rounded-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50`}
              >
                {isDeployed ? 'Strategy Deployed' : 'Deploy Strategy'}
              </button>
            </div>
          )}
        </div>
      )}

      {selectedFeature && selectedFeature !== 'custom-strategy' && (
        <div className={`p-8 ${colors.bg.secondary} border ${colors.border.secondary} rounded-sm text-center`}>
          <div className={`text-button ${colors.text.tertiary}`}>
            Configuration interface for {ENTERPRISE_FEATURES.find(f => f.id === selectedFeature)?.name} coming soon
          </div>
        </div>
      )}
    </div>
  );
}
