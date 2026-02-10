/**
 * Error Message Component
 * 
 * Displays user-friendly error messages with optional retry functionality.
 * Used throughout the app for API errors and failed operations.
 * 
 * Usage:
 * ```tsx
 * {error && (
 *   <ErrorMessage 
 *     error={error}
 *     onRetry={refetch}
 *     title="Failed to load data"
 *   />
 * )}
 * ```
 */

import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';

interface ErrorMessageProps {
  /**
   * Error object or error message string
   */
  error: Error | string;
  
  /**
   * Optional custom title (defaults to "Error")
   */
  title?: string;
  
  /**
   * Optional retry function
   */
  onRetry?: () => void;
  
  /**
   * Optional dismiss function
   */
  onDismiss?: () => void;
  
  /**
   * Size variant
   */
  variant?: 'default' | 'compact' | 'inline';
  
  /**
   * Whether to show error details in development
   */
  showDetails?: boolean;
}

export function ErrorMessage({
  error,
  title = 'Error',
  onRetry,
  onDismiss,
  variant = 'default',
  showDetails = true,
}: ErrorMessageProps) {
  const { colors } = useThemeStore();
  
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  // Inline variant - single line with icon
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>{errorMessage}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-auto text-xs underline hover:no-underline"
          >
            Retry
          </button>
        )}
      </div>
    );
  }
  
  // Compact variant - minimal padding
  if (variant === 'compact') {
    return (
      <div className={`flex items-start gap-3 p-3 ${colors.bg.secondary} border ${colors.border.secondary} rounded-sm`}>
        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        
        <div className="flex-1 min-w-0">
          <p className="text-sm text-red-600 dark:text-red-400">
            {errorMessage}
          </p>
        </div>
        
        {(onRetry || onDismiss) && (
          <div className="flex items-center gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
              >
                Retry
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className={`${colors.text.tertiary} hover:text-gray-900 dark:hover:text-white`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
  
  // Default variant - full featured
  return (
    <div className={`p-6 ${colors.bg.secondary} border ${colors.border.secondary} rounded-sm`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
            {title}
          </h3>
          
          <p className={`text-sm ${colors.text.secondary} mb-4`}>
            {errorMessage}
          </p>
          
          {/* Error Details (Development Only) */}
          {import.meta.env.DEV && showDetails && typeof error !== 'string' && (
            <details className="mb-4">
              <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 mb-2">
                Show error details
              </summary>
              <pre className={`text-xs ${colors.text.tertiary} ${colors.bg.tertiary} p-3 rounded-sm overflow-auto max-h-40 font-mono`}>
                {error.stack || error.toString()}
              </pre>
            </details>
          )}
          
          {/* Actions */}
          {(onRetry || onDismiss) && (
            <div className="flex items-center gap-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white rounded-sm hover:bg-orange-700 transition-colors text-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry
                </button>
              )}
              
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className={`text-sm ${colors.text.tertiary} hover:text-gray-900 dark:hover:text-white`}
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Error Alert - Simple alert-style error message
 * Used for form validation errors and inline notifications
 */
export function ErrorAlert({ message }: { message: string }) {
  const { colors } = useThemeStore();
  
  return (
    <div className={`flex items-center gap-2 px-3 py-2 ${colors.bg.secondary} border border-red-300 dark:border-red-800 rounded-sm`}>
      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
      <span className="text-sm text-red-600 dark:text-red-400">{message}</span>
    </div>
  );
}