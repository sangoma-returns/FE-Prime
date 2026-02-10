import { UseFormReturn } from 'react-hook-form';
import { useThemeStore } from '../../stores/themeStore';
import { VaultFormData, VAULTS } from './types';
import { FormField } from './FormField';

interface AutomatedTabProps {
  form: UseFormReturn<VaultFormData>;
  onDeploy: (data: VaultFormData) => void;
}

export function AutomatedTab({ form, onDeploy }: AutomatedTabProps) {
  const { colors } = useThemeStore();
  const { register, watch, setValue, formState: { errors } } = form;

  const selectedVault = watch('selectedVault');

  const selectedVaultData = VAULTS.find(v => v.id === selectedVault);

  const handleSubmit = form.handleSubmit(onDeploy);

  return (
    <form onSubmit={handleSubmit}>
      <div className="max-w-4xl">
        <div className="mb-6">
          <h3 className="text-button font-medium mb-3">Select Vault Strategy</h3>
          <div className="grid grid-cols-2 gap-3">
            {VAULTS.map((vault) => (
              <button
                key={vault.id}
                type="button"
                onClick={() => setValue('selectedVault', vault.id)}
                className={`p-4 text-left border rounded-sm transition-all ${
                  selectedVault === vault.id
                    ? `${colors.border.brand} ${colors.bg.brandSubtle}`
                    : `${colors.border.secondary} ${colors.bg.secondary} hover:${colors.border.primary}`
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="font-medium text-button">{vault.name}</div>
                  <div className={`text-button font-medium ${vault.pnl > 0 ? colors.text.green : colors.text.red}`}>
                    {vault.pnl > 0 ? '+' : ''}{vault.pnl.toFixed(1)}%
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className={`text-[10px] ${colors.text.tertiary}`}>TVL</div>
                    <div className="text-[11px] font-medium">
                      ${(vault.tvl / 1000000).toFixed(1)}M
                    </div>
                  </div>
                  <div>
                    <div className={`text-[10px] ${colors.text.tertiary}`}>Volume</div>
                    <div className="text-[11px] font-medium">
                      ${(vault.volume / 1000000).toFixed(0)}M
                    </div>
                  </div>
                  <div>
                    <div className={`text-[10px] ${colors.text.tertiary}`}>APY</div>
                    <div className="text-[11px] font-medium">
                      {vault.apy.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedVault && selectedVaultData && (
          <>
            {/* Vault Details */}
            <div className={`mb-6 p-4 ${colors.bg.secondary} border ${colors.border.secondary} rounded-sm`}>
              <h3 className="text-button font-medium mb-3">{selectedVaultData.name} Strategy Details</h3>
              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between">
                  <span className={colors.text.tertiary}>Performance (30d)</span>
                  <span className={`font-medium ${selectedVaultData.pnl > 0 ? colors.text.green : colors.text.red}`}>
                    {selectedVaultData.pnl > 0 ? '+' : ''}{selectedVaultData.pnl.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={colors.text.tertiary}>Total Value Locked</span>
                  <span className="font-medium">
                    ${selectedVaultData.tvl.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={colors.text.tertiary}>24h Volume</span>
                  <span className="font-medium">
                    ${(selectedVaultData.volume / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={colors.text.tertiary}>Annual APY</span>
                  <span className={`font-medium ${colors.text.green}`}>
                    {selectedVaultData.apy.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Deployment Configuration */}
            <div>
              <h3 className="text-button font-medium mb-3">Deployment Configuration</h3>
              <div className={`p-4 ${colors.bg.secondary} border ${colors.border.secondary} rounded-sm space-y-3`}>
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    label="Capital to Deploy (USDC)"
                    {...register('deployCapital')}
                    error={errors.deployCapital?.message}
                    placeholder="1000"
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
                  <FormField
                    label="Slippage Tolerance (%)"
                    {...register('slippageTolerance')}
                    error={errors.slippageTolerance?.message}
                    placeholder="0.5"
                    type="number"
                    step="0.1"
                  />
                  <FormField
                    label="Max Drawdown (%)"
                    {...register('maxDrawdown')}
                    error={errors.maxDrawdown?.message}
                    placeholder="5"
                    type="number"
                    step="0.1"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!selectedVault}
                  className={`w-full px-4 py-3 ${colors.bg.brand} ${colors.text.brandContrast} rounded-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Deploy to Vault
                </button>
              </div>
            </div>
          </>
        )}

        {!selectedVault && (
          <div className={`p-8 text-center ${colors.bg.secondary} border ${colors.border.secondary} rounded-sm`}>
            <div className={`text-button ${colors.text.tertiary}`}>
              Select a vault strategy to continue
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
