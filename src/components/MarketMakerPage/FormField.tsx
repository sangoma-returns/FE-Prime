import { forwardRef } from 'react';
import { useThemeStore } from '../../stores/themeStore';
import { Info } from 'lucide-react';
import { Tooltip } from '../Tooltip';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  tooltip?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, tooltip, ...props }, ref) => {
    const { colors } = useThemeStore();

    return (
      <div>
        <label className={`block text-[11px] font-medium ${colors.text.secondary} mb-1.5 flex items-center gap-1.5`}>
          {label}
          {tooltip && (
            <Tooltip content={tooltip} position="right">
              <Info className={`w-3.5 h-3.5 ${colors.text.tertiary}`} />
            </Tooltip>
          )}
        </label>
        <input
          ref={ref}
          className={`w-full px-3 py-2 text-button ${colors.bg.tertiary} border ${
            error ? 'border-red-500' : colors.border.secondary
          } rounded-sm focus:outline-none focus:${colors.border.primary} transition-colors`}
          {...props}
        />
        {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
      </div>
    );
  }
);

FormField.displayName = 'FormField';
