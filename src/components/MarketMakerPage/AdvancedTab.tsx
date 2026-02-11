import { UseFormReturn, Controller } from 'react-hook-form@7.55.0';
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
  const { watch, setValue, control, formState: { errors } } = form;

  const selectedExchange = watch('exchange');
  const selectedPair = watch('pair');
}