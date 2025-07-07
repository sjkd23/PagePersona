/**
 * Centralized Logger Utility
 * 
 * This logger replaces all console.* usage throughout the application
 * with a consistent, configurable logging system that includes:
 * - Structured log levels (info, warn, error, debug)
 * - Contextual prefixes with emojis for better readability
 * - Environment-based debug logging
 * - Optional structured logging data
 */

import type { LogData } from '../types/common';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment: boolean;
  private isDebugMode: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.isDebugMode = process.env.DEBUG === 'true' || this.isDevelopment;
  }

  /**
   * Format timestamp for logs
   */
  private getTimestamp(): string {
    return new Date().toISOString();
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
   * Format log message with optional data
   */
  private formatMessage(level: LogLevel, message: string, data?: LogData): string {
    const timestamp = this.getTimestamp();
    const prefix = this.getLevelPrefix(level);
    let formattedMessage = `${prefix} ${message}`;
    
    if (data && Object.keys(data).length > 0) {
      formattedMessage += `\n  Data: ${JSON.stringify(data, null, 2)}`;
    }

    return formattedMessage;
  }

  /**
   * Debug level logging - only shown in development or when DEBUG=true
   */
  debug(message: string, data?: LogData): void {
    if (this.isDebugMode) {
      const formattedMessage = this.formatMessage('debug', message, data);
      console.debug(formattedMessage);
    }
  }

  /**
   * Info level logging - general information
   */
  info(message: string, data?: LogData): void {
    const formattedMessage = this.formatMessage('info', message, data);
    console.info(formattedMessage);
  }

  /**
   * Warning level logging - for concerning but non-critical issues
   */
  warn(message: string, data?: LogData): void {
    const formattedMessage = this.formatMessage('warn', message, data);
    console.warn(formattedMessage);
  }

  /**
   * Error level logging - for errors and exceptions
   */
  error(message: string, error?: Error | unknown, data?: LogData): void {
    let errorData: LogData = { ...data };
    
    if (error) {
      if (error instanceof Error) {
        errorData.error = {
          name: error.name,
          message: error.message,
          stack: error.stack
        };
      } else if (typeof error === 'object' && error !== null) {
        errorData.error = error;
      } else {
        errorData.error = { message: String(error) };
      }
    }

    const formattedMessage = this.formatMessage('error', message, errorData);
    console.error(formattedMessage);
  }

  /**
   * Context-specific loggers for different parts of the application
   */

  // Transform route specific logging
  transform = {
    info: (message: string, data?: LogData) => this.info(`[Transform] ${message}`, data),
    warn: (message: string, data?: LogData) => this.warn(`[Transform] ${message}`, data),
    error: (message: string, error?: Error | unknown, data?: LogData) => this.error(`[Transform] ${message}`, error, data),
    debug: (message: string, data?: LogData) => this.debug(`[Transform] ${message}`, data)
  };

  // Authentication specific logging
  auth = {
    info: (message: string, data?: LogData) => this.info(`[Auth] ${message}`, data),
    warn: (message: string, data?: LogData) => this.warn(`[Auth] ${message}`, data),
    error: (message: string, error?: Error | unknown, data?: LogData) => this.error(`[Auth] ${message}`, error, data),
    debug: (message: string, data?: LogData) => this.debug(`[Auth] ${message}`, data)
  };

  // Database specific logging
  db = {
    info: (message: string, data?: LogData) => this.info(`[DB] ${message}`, data),
    warn: (message: string, data?: LogData) => this.warn(`[DB] ${message}`, data),
    error: (message: string, error?: Error | unknown, data?: LogData) => this.error(`[DB] ${message}`, error, data),
    debug: (message: string, data?: LogData) => this.debug(`[DB] ${message}`, data)
  };

  // API specific logging
  api = {
    info: (message: string, data?: LogData) => this.info(`[API] ${message}`, data),
    warn: (message: string, data?: LogData) => this.warn(`[API] ${message}`, data),
    error: (message: string, error?: Error | unknown, data?: LogData) => this.error(`[API] ${message}`, error, data),
    debug: (message: string, data?: LogData) => this.debug(`[API] ${message}`, data)
  };

  // OpenAI specific logging
  openai = {
    info: (message: string, data?: LogData) => this.info(`[OpenAI] ${message}`, data),
    warn: (message: string, data?: LogData) => this.warn(`[OpenAI] ${message}`, data),
    error: (message: string, error?: Error | unknown, data?: LogData) => this.error(`[OpenAI] ${message}`, error, data),
    debug: (message: string, data?: LogData) => this.debug(`[OpenAI] ${message}`, data)
  };

  // Usage tracking specific logging
  usage = {
    info: (message: string, data?: LogData) => this.info(`[Usage] ${message}`, data),
    warn: (message: string, data?: LogData) => this.warn(`[Usage] ${message}`, data),
    error: (message: string, error?: Error | unknown, data?: LogData) => this.error(`[Usage] ${message}`, error, data),
    debug: (message: string, data?: LogData) => this.debug(`[Usage] ${message}`, data)
  };

  // Test specific logging
  test = {
    info: (message: string, data?: LogData) => this.info(`[Test] ${message}`, data),
    warn: (message: string, data?: LogData) => this.warn(`[Test] ${message}`, data),
    error: (message: string, error?: Error | unknown, data?: LogData) => this.error(`[Test] ${message}`, error, data),
    debug: (message: string, data?: LogData) => this.debug(`[Test] ${message}`, data)
  };

  // Session specific logging
  session = {
    info: (message: string, data?: LogData) => this.info(`[Session] ${message}`, data),
    warn: (message: string, data?: LogData) => this.warn(`[Session] ${message}`, data),
    error: (message: string, error?: Error | unknown, data?: LogData) => this.error(`[Session] ${message}`, error, data),
    debug: (message: string, data?: LogData) => this.debug(`[Session] ${message}`, data)
  };

  // Validation specific logging
  validation = {
    info: (message: string, data?: LogData) => this.info(`[Validation] ${message}`, data),
    warn: (message: string, data?: LogData) => this.warn(`[Validation] ${message}`, data),
    error: (message: string, error?: Error | unknown, data?: LogData) => this.error(`[Validation] ${message}`, error, data),
    debug: (message: string, data?: LogData) => this.debug(`[Validation] ${message}`, data)
  };
}

// Export singleton instance
export const logger = new Logger();

// Export type for external usage
export type { LogData };
