/**
 * Centralized logging utility for debugging and monitoring
 * 
 * Features:
 * - Prefixed logs for easy filtering
 * - Different log levels (debug, info, warn, error)
 * - Automatic disabling in production
 * - Structured data logging
 * - Performance timing
 */

const IS_DEV = __DEV__;
const ENABLE_LOGS = IS_DEV || process.env.EXPO_PUBLIC_SHOW_DIAGNOSTICS === 'true';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogContext {
  [key: string]: any;
}

class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private formatMessage(level: LogLevel, message: string, data?: LogContext): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${this.context}] [${level}]`;
    return data ? `${prefix} ${message} ${JSON.stringify(data)}` : `${prefix} ${message}`;
  }

  /**
   * Debug-level logs (verbose, only in development)
   */
  debug(message: string, data?: LogContext) {
    if (ENABLE_LOGS) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, data));
    }
  }

  /**
   * Info-level logs (general information)
   */
  info(message: string, data?: LogContext) {
    if (ENABLE_LOGS) {
      console.log(this.formatMessage(LogLevel.INFO, message, data));
    }
  }

  /**
   * Warning-level logs (potential issues)
   */
  warn(message: string, data?: LogContext) {
    if (ENABLE_LOGS) {
      console.warn(this.formatMessage(LogLevel.WARN, message, data));
    }
  }

  /**
   * Error-level logs (always logged, even in production)
   */
  error(message: string, error?: Error | any, data?: LogContext) {
    const errorData = error instanceof Error 
      ? { message: error.message, stack: error.stack, ...data }
      : { error, ...data };
    
    console.error(this.formatMessage(LogLevel.ERROR, message, errorData));
  }

  /**
   * Assert a condition and log error if false
   */
  assert(condition: boolean, message: string, data?: LogContext) {
    if (!condition) {
      this.error(`Assertion failed: ${message}`, undefined, data);
      if (IS_DEV) {
        // In development, throw to catch issues early
        throw new Error(`Assertion failed: ${message}`);
      }
    }
  }

  /**
   * Time a function execution
   */
  async time<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    this.debug(`⏱️ Starting: ${label}`);
    
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.debug(`✅ Completed: ${label}`, { duration: `${duration}ms` });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`❌ Failed: ${label}`, error, { duration: `${duration}ms` });
      throw error;
    }
  }

  /**
   * Log API calls with request/response
   */
  api(method: string, endpoint: string, data?: LogContext) {
    this.debug(`🌐 API ${method} ${endpoint}`, data);
  }

  /**
   * Log navigation events
   */
  navigation(screen: string, params?: LogContext) {
    this.debug(`📱 Navigate to: ${screen}`, params);
  }

  /**
   * Log user actions
   */
  action(action: string, data?: LogContext) {
    this.info(`👤 User action: ${action}`, data);
  }
}

/**
 * Create a logger for a specific context
 * 
 * @example
 * const logger = createLogger('AuthService');
 * logger.info('User logged in', { userId: user.id });
 * logger.error('Login failed', error);
 */
export function createLogger(context: string): Logger {
  return new Logger(context);
}

// Export a default logger for quick use
export const logger = createLogger('App');
