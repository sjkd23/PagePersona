/**
 * Client-Side Centralized Logger Utility
 * 
 * Provides consistent logging across the React application with
 * structured log levels, environment-aware debug mode, and browser-friendly
 * formatting. Replaces direct console usage with categorized logging.
 * 
 * Features:
 * - Environment-based debug control
 * - Structured log levels with visual indicators
 * - Context-specific log categorization
 * - Development vs production behavior
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogData {
  [key: string]: unknown;
}

/**
 * Client Logger Class
 * 
 * Manages client-side logging with environment detection and
 * structured output formatting for development debugging.
 */
class ClientLogger {
  private isDevelopment: boolean;
  private isDebugMode: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV || process.env.NODE_ENV !== 'production';
    this.isDebugMode = import.meta.env.VITE_DEBUG === 'true' || this.isDevelopment;
  }

  /**
   * Generate level prefix with visual indicators
   * 
   * @param level - Log level to format
   * @returns Formatted prefix string with visual markers
   */
  private getLevelPrefix(level: LogLevel): string {
    const prefixes = {
      debug: '🐛 [DEBUG]',
      info: 'ℹ️  [INFO]',
      warn: '⚠️  [WARN]',
      error: '❌ [ERROR]'
    };
    return prefixes[level];
  }

  /**
   * Debug level logging - only shown in development or when DEBUG=true
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.isDebugMode) {
      console.debug(this.getLevelPrefix('debug'), message, ...args);
    }
  }

  /**
   * Info level logging - general information
   */
  info(message: string, ...args: unknown[]): void {
    console.info(this.getLevelPrefix('info'), message, ...args);
  }

  /**
   * Warning level logging - for concerning but non-critical issues
   */
  warn(message: string, ...args: unknown[]): void {
    console.warn(this.getLevelPrefix('warn'), message, ...args);
  }

  /**
   * Error level logging - for errors and exceptions
   */
  error(message: string, error?: Error | unknown, ...args: unknown[]): void {
    if (error) {
      console.error(this.getLevelPrefix('error'), message, error, ...args);
    } else {
      console.error(this.getLevelPrefix('error'), message, ...args);
    }
  }

  /**
   * Context-specific loggers for different parts of the client application
   */

  // Component specific logging
  component = {
    info: (component: string, message: string, ...args: unknown[]) => 
      this.info(`[${component}] ${message}`, ...args),
    warn: (component: string, message: string, ...args: unknown[]) => 
      this.warn(`[${component}] ${message}`, ...args),
    error: (component: string, message: string, error?: Error | unknown, ...args: unknown[]) => 
      this.error(`[${component}] ${message}`, error, ...args),
    debug: (component: string, message: string, ...args: unknown[]) => 
      this.debug(`[${component}] ${message}`, ...args)
  };

  // API call specific logging
  api = {
    info: (message: string, ...args: unknown[]) => this.info(`[API] ${message}`, ...args),
    warn: (message: string, ...args: unknown[]) => this.warn(`[API] ${message}`, ...args),
    error: (message: string, error?: Error | unknown, ...args: unknown[]) => this.error(`[API] ${message}`, error, ...args),
    debug: (message: string, ...args: unknown[]) => this.debug(`[API] ${message}`, ...args)
  };

  // Authentication specific logging
  auth = {
    info: (message: string, ...args: unknown[]) => this.info(`[Auth] ${message}`, ...args),
    warn: (message: string, ...args: unknown[]) => this.warn(`[Auth] ${message}`, ...args),
    error: (message: string, error?: Error | unknown, ...args: unknown[]) => this.error(`[Auth] ${message}`, error, ...args),
    debug: (message: string, ...args: unknown[]) => this.debug(`[Auth] ${message}`, ...args)
  };

  // User sync specific logging
  sync = {
    info: (message: string, ...args: unknown[]) => this.info(`[Sync] ${message}`, ...args),
    warn: (message: string, ...args: unknown[]) => this.warn(`[Sync] ${message}`, ...args),
    error: (message: string, error?: Error | unknown, ...args: unknown[]) => this.error(`[Sync] ${message}`, error, ...args),
    debug: (message: string, ...args: unknown[]) => this.debug(`[Sync] ${message}`, ...args)
  };
}

// Export singleton instance
export const logger = new ClientLogger();

// Export type for external usage
export type { LogData };
