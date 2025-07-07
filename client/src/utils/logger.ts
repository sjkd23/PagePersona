/**
 * Client-Side Centralized Logger Utility
 * 
 * This logger replaces all console.* usage in the React application
 * with a consistent logging system that includes:
 * - Structured log levels (info, warn, error, debug)
 * - Environment-based debug logging
 * - Browser-friendly formatting
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogData {
  [key: string]: any;
}

class ClientLogger {
  private isDevelopment: boolean;
  private isDebugMode: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV || process.env.NODE_ENV !== 'production';
    this.isDebugMode = import.meta.env.VITE_DEBUG === 'true' || this.isDevelopment;
  }

  /**
   * Get level prefix with emoji
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
  debug(message: string, ...args: any[]): void {
    if (this.isDebugMode) {
      console.debug(this.getLevelPrefix('debug'), message, ...args);
    }
  }

  /**
   * Info level logging - general information
   */
  info(message: string, ...args: any[]): void {
    console.info(this.getLevelPrefix('info'), message, ...args);
  }

  /**
   * Warning level logging - for concerning but non-critical issues
   */
  warn(message: string, ...args: any[]): void {
    console.warn(this.getLevelPrefix('warn'), message, ...args);
  }

  /**
   * Error level logging - for errors and exceptions
   */
  error(message: string, error?: Error | any, ...args: any[]): void {
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
    info: (component: string, message: string, ...args: any[]) => 
      this.info(`[${component}] ${message}`, ...args),
    warn: (component: string, message: string, ...args: any[]) => 
      this.warn(`[${component}] ${message}`, ...args),
    error: (component: string, message: string, error?: Error | any, ...args: any[]) => 
      this.error(`[${component}] ${message}`, error, ...args),
    debug: (component: string, message: string, ...args: any[]) => 
      this.debug(`[${component}] ${message}`, ...args)
  };

  // API call specific logging
  api = {
    info: (message: string, ...args: any[]) => this.info(`[API] ${message}`, ...args),
    warn: (message: string, ...args: any[]) => this.warn(`[API] ${message}`, ...args),
    error: (message: string, error?: Error | any, ...args: any[]) => this.error(`[API] ${message}`, error, ...args),
    debug: (message: string, ...args: any[]) => this.debug(`[API] ${message}`, ...args)
  };

  // Authentication specific logging
  auth = {
    info: (message: string, ...args: any[]) => this.info(`[Auth] ${message}`, ...args),
    warn: (message: string, ...args: any[]) => this.warn(`[Auth] ${message}`, ...args),
    error: (message: string, error?: Error | any, ...args: any[]) => this.error(`[Auth] ${message}`, error, ...args),
    debug: (message: string, ...args: any[]) => this.debug(`[Auth] ${message}`, ...args)
  };

  // User sync specific logging
  sync = {
    info: (message: string, ...args: any[]) => this.info(`[Sync] ${message}`, ...args),
    warn: (message: string, ...args: any[]) => this.warn(`[Sync] ${message}`, ...args),
    error: (message: string, error?: Error | any, ...args: any[]) => this.error(`[Sync] ${message}`, error, ...args),
    debug: (message: string, ...args: any[]) => this.debug(`[Sync] ${message}`, ...args)
  };
}

// Export singleton instance
export const logger = new ClientLogger();

// Export type for external usage
export type { LogData };
