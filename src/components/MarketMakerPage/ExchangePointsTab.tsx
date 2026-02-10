import { useThemeStore } from '../../stores/themeStore';
import { EXCHANGE_POINTS } from './types';

export function ExchangePointsTab() {
  const { colors } = useThemeStore();

  return (
    <div className="max-w-4xl">
      <div className="mb-4">
        <h3 className="text-button font-medium">Exchange Points Programs</h3>
        <p className={`text-[11px] ${colors.text.tertiary} mt-0.5`}>
          Track your market making rewards across supported exchanges
        </p>
      </div>

      <div className="space-y-3">
        {EXCHANGE_POINTS.map((exchange) => (
          <div
            key={exchange.name}
            className={`p-4 ${colors.bg.secondary} border ${colors.border.secondary} rounded-sm`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-button font-medium">{exchange.name}</span>
                  {exchange.status && (
                    <span
                      className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                        exchange.status === 'active'
                          ? `${colors.bg.greenSubtle} ${colors.text.green}`
                          : `${colors.bg.tertiary} ${colors.text.tertiary}`
                      }`}
                    >
                      {exchange.status === 'active' ? 'Active' : 'Concluded'}
                    </span>
                  )}
                </div>
                {!exchange.supportsPoints && (
                  <p className={`text-[11px] ${colors.text.tertiary} mt-1`}>
                    No points program available
                  </p>
                )}
              </div>

              {exchange.supportsPoints && exchange.pointsEarned !== null && (
                <div className="text-right">
                  <div className={`text-[11px] ${colors.text.tertiary}`}>Points Earned</div>
                  <div className="text-button font-medium">
                    {exchange.pointsEarned.toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {exchange.supportsPoints && (
              <div className={`mt-3 pt-3 border-t ${colors.border.secondary}`}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className={colors.text.tertiary}>Est. Monthly Accrual</span>
                  <span className="font-medium">
                    ~{Math.floor((exchange.pointsEarned || 0) * 0.3).toLocaleString()} pts
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={`mt-6 p-4 ${colors.bg.brandSubtle} border ${colors.border.brand} rounded-sm`}>
        <div className="flex items-start gap-3">
          <div className={`w-1 h-1 rounded-full ${colors.bg.brand} mt-1.5`} />
          <div className="flex-1">
            <div className="text-button font-medium mb-1">Maximize Your Rewards</div>
            <p className={`text-[11px] ${colors.text.secondary}`}>
              Deploy market making strategies on exchanges with active points programs to earn additional
              rewards while providing liquidity. Points accumulate automatically based on your trading
              volume and can often be redeemed for tokens during exchange airdrops.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
