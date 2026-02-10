import { useWatch } from 'react-hook-form@7.55.0';
import { useThemeStore } from '../../stores/themeStore';
import { MarketMakerFormData } from './types';

interface StrategySummaryProps {
  control: any; // react-hook-form control
}

export function StrategySummary({ control }: StrategySummaryProps) {
  const { colors } = useThemeStore();
  
  // Use useWatch to subscribe only to the fields we need
  const margin = useWatch({ control, name: 'margin', defaultValue: '' });
  const leverage = useWatch({ control, name: 'leverage', defaultValue: '1' });
  const spreadBps = useWatch({ control, name: 'spreadBps', defaultValue: '10' });
  const participationRate = useWatch({ control, name: 'participationRate', defaultValue: 'neutral' });
  const enableAutoRepeat = useWatch({ control, name: 'enableAutoRepeat', defaultValue: false });
  const maxRuns = useWatch({ control, name: 'maxRuns', defaultValue: '3' });

  // Calculate volume
  const marginNum = parseFloat(margin) || 0;
  const leverageNum = parseFloat(leverage) || 1;
  const volume = marginNum * leverageNum * 20;

  // Calculate estimates
  const calculateEstimates = () => {
    const spreadBpsNum = parseFloat(spreadBps) || 0;
    const maxRunsNum = parseFloat(maxRuns) || 1;
    
    // Calculate how many runs can fit in 24 hours based on participation rate
    const timePerRunMinutes = {
      aggressive: 5,
      neutral: 15,
      passive: 45,
    }[participationRate];
    
    const maxPossibleRunsPerDay = Math.floor((24 * 60) / timePerRunMinutes);
    
    // Actual runs per day
    let actualRunsPerDay = 1;
    if (enableAutoRepeat) {
      actualRunsPerDay = Math.min(maxPossibleRunsPerDay, maxRunsNum);
    }
    
    // Daily volume estimate
    const dailyVolume = volume * actualRunsPerDay;
    
    // Maker fee rebate (typical: -0.01% = -0.0001)
    const makerFeeRate = -0.0001;
    const makerFees = dailyVolume * Math.abs(makerFeeRate);
    
    // Spread capture (capture ~50% of spread on average)
    const spreadCaptureRate = (spreadBpsNum / 10000) / 2;
    const spreadProfit = dailyVolume * spreadCaptureRate;
    
    // Total daily return
    const dailyReturn = spreadProfit + makerFees;
    
    return {
      dailyVolume,
      makerFees,
      dailyReturn,
      actualRunsPerDay,
    };
  };

  const estimates = calculateEstimates();

  return (
    <div className={`p-4 ${colors.bg.tertiary} border ${colors.border.secondary} rounded-sm`}>
      <h3 className="text-button font-medium mb-3">Strategy Summary</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Volume Per Run */}
        <div>
          <div className={`text-[11px] ${colors.text.tertiary} mb-0.5`}>Volume Per Run</div>
          <div className="text-button font-medium">
            ${volume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Runs Per Day */}
        <div>
          <div className={`text-[11px] ${colors.text.tertiary} mb-0.5`}>
            {enableAutoRepeat ? 'Runs Per Day' : 'Single Run'}
          </div>
          <div className="text-button font-medium">
            {enableAutoRepeat ? estimates.actualRunsPerDay : '1'}
          </div>
        </div>

        {/* Daily Volume */}
        <div>
          <div className={`text-[11px] ${colors.text.tertiary} mb-0.5`}>Daily Volume</div>
          <div className="text-button font-medium">
            ${estimates.dailyVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Maker Fees */}
        <div>
          <div className={`text-[11px] ${colors.text.tertiary} mb-0.5`}>Maker Fees</div>
          <div className={`text-button font-medium ${colors.text.green}`}>
            +${estimates.makerFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Daily Return */}
        <div className="col-span-2">
          <div className={`text-[11px] ${colors.text.tertiary} mb-0.5`}>Est. Daily Return</div>
          <div className={`text-button font-medium ${colors.text.green}`}>
            +${estimates.dailyReturn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className={`mt-3 pt-3 border-t ${colors.border.secondary} text-[11px] ${colors.text.tertiary}`}>
        <div className="flex items-center justify-between mb-1">
          <span>Participation</span>
          <span className="capitalize font-medium">{participationRate}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Auto-Repeat</span>
          <span className="font-medium">{enableAutoRepeat ? 'Enabled' : 'Disabled'}</span>
        </div>
      </div>
    </div>
  );
}