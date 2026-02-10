/**
 * Application Logger
 * 
 * Centralized logging utility that:
 * - Filters logs based on environment (dev/prod)
 * - Provides consistent log formatting
 * - Can be extended to send logs to monitoring services (Sentry, DataDog, etc.)
 * - Prevents console pollution in production
 * 
 * Usage:
 * ```ts
 * import { logger } from './utils/logger';
 * 
 * logger.debug('Debug info'); // Only in development
 * logger.info('Info message'); // Only in development
 * logger.warn('Warning'); // Always logged
 * logger.error('Error occurred', error); // Always logged + sent to monitoring
 * ```
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDev = import.meta.env.DEV;
  private appName = 'Bitfrost';

  /**
   * Debug logs - only in development
   * Use for verbose debugging information
   */
  debug(message: string, ...args: any[]): void {
    if (this.isDev) {
      console.debug(`[${this.appName}] [DEBUG]`, message, ...args);
    }
  }

  /**
   * Info logs - only in development
   * Use for general information
   */
  info(message: string, ...args: any[]): void {
    if (this.isDev) {
      console.info(`[${this.appName}] [INFO]`, message, ...args);
    }
  }

  /**
   * Warning logs - always logged
   * Use for recoverable issues
   */
  warn(message: string, context?: LogContext): void {
    console.warn(`[${this.appName}] [WARN]`, message, context);
    
    if (!this.isDev) {
      this.sendToMonitoring('warn', message, context);
    }
  }

  /**
   * Error logs - always logged
   * Use for errors and exceptions
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    console.error(`[${this.appName}] [ERROR]`, message, error, context);
    
    if (!this.isDev) {
      this.sendToMonitoring('error', message, { error, ...context });
    }
  }

  /**
   * API request logging - only in development
   */
  apiRequest(method: string, url: string, data?: any): void {
    if (this.isDev) {
      console.log(`[${this.appName}] [API REQUEST] ${method.toUpperCase()} ${url}`, data);
    }
  }

  /**
   * API response logging - only in development
   */
  apiResponse(url: string, data?: any): void {
    if (this.isDev) {
      console.log(`[${this.appName}] [API RESPONSE] ${url}`, data);
    }
  }

  /**
   * WebSocket event logging - only in development
   */
  ws(event: string, data?: any): void {
    if (this.isDev) {
      console.log(`[${this.appName}] [WebSocket] ${event}`, data);
    }
  }

  /**
   * Send logs to monitoring service
   * 
   * Placeholder for integration with services like:
   * - Sentry (error tracking)
   * - DataDog (logging & monitoring)
   * - LogRocket (session replay)
   * - Custom analytics endpoint
   */
  private sendToMonitoring(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): void {
    try {
      // Example: Sentry integration
      // if (window.Sentry) {
      //   window.Sentry.captureMessage(message, {
      //     level: level as SeverityLevel,
      //     extra: context,
      //   });
      // }

      // Example: Custom analytics endpoint
      // fetch('/api/logs', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     level,
      //     message,
      //     context,
      //     timestamp: new Date().toISOString(),
      //     userAgent: navigator.userAgent,
      //   }),
      // });
    } catch (error) {
      // Silently fail - don't break app if logging fails
      console.error('Failed to send log to monitoring:', error);
    }
  }
}

/**
 * Singleton logger instance
 */
export const logger = new Logger();

/**
 * Performance measurement utility
 * 
 * Wraps a function and logs if execution time exceeds threshold
 * 
 * Usage:
 * ```ts
 * const slowOperation = measurePerformance(() => {
 *   // expensive calculation
 * }, 'My Operation');
 * ```
 */
export function measurePerformance<T extends (...args: any[]) => any>(
  fn: T,
  name: string,
  threshold: number = 16 // 1 frame at 60fps
): T {
  return ((...args: Parameters<T>) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    const duration = end - start;
    
    if (duration > threshold) {
      logger.warn(`Slow operation: ${name} took ${duration.toFixed(2)}ms`, {
        duration,
        threshold,
      });
    }
    
    return result;
  }) as T;
}
