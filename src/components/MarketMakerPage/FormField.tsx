import { Controller, Control, FieldPath, FieldValues } from 'react-hook-form@7.55.0';
import { useThemeStore } from '../../stores/themeStore';
import { Info } from 'lucide-react';
import { Tooltip } from '../Tooltip';
import { cn } from '../ui/utils';

// Props when using React Hook Form
interface FormFieldWithControlProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'> {
  label: string;
  tooltip?: string;
  control: Control<TFieldValues>;
  name: TName;
  error?: never; // Don't allow error prop when using control - use fieldState instead
}

// Props when NOT using React Hook Form (controlled/uncontrolled input)
interface FormFieldWithoutControlProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  tooltip?: string;
  control?: never;
  name?: string;
  error?: string; // Allow error prop for non-RHF usage
}

type FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = FormFieldWithControlProps<TFieldValues, TName> | FormFieldWithoutControlProps;

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(props: FormFieldProps<TFieldValues, TName>) {
  const { colors } = useThemeStore();
  const { label, error, tooltip, control, name, className, ...inputProps } = props;

  // Base classes that should never be overridden
  const getInputClassName = (hasError: boolean) => {
    return cn(
      "w-full px-3 py-2 text-button rounded-sm focus:outline-none transition-colors border",
      colors.bg.tertiary,
      hasError ? "border-red-500" : colors.border.secondary,
      `focus:${colors.border.primary}`,
      className
    );
  };

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
      
      {/* If control is provided, use React Hook Form Controller */}
      {control && name ? (
        <Controller
          name={name as TName}
          control={control}
          render={({ field, fieldState }) => (
            <>
              <input
                {...field}
                className={getInputClassName(!!fieldState.error)}
                {...inputProps}
              />
              {fieldState.error && (
                <p className="mt-1 text-[11px] text-red-500">{fieldState.error.message}</p>
              )}
            </>
          )}
        />
      ) : (
        // Otherwise, render a regular input (works with useState or uncontrolled)
        <>
          <input
            className={getInputClassName(!!error)}
            {...inputProps}
          />
          {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
        </>
      )}
    </div>
  );
}