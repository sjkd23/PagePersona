/**
 * Centralized Logger Utility
 * 
 * This logger provides a consistent, configurable logging system throughout
 * the application with structured logging capabilities and environment-aware
 * debug output.
 * 
 * Features:
 * - Structured log levels (debug, info, warn, error)
 * - Contextual prefixes for better log organization
 * - Environment-based debug logging control
 * - Optional structured logging data
 * - Context-specific loggers for different application modules
 * - Proper error object handling and serialization
 * 
 * The logger replaces direct console usage to provide consistent
 * logging patterns and better debugging capabilities.
 */

/* eslint-disable no-console */
import type { LogData } from '../types/common';

/**
 * Available log levels for the logging system
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Logger class providing structured logging functionality
 * 
 * Manages log output with configurable levels, contextual information,
 * and environment-specific behavior for development and production use.
 */
class Logger {
  private isDevelopment: boolean;
  private isDebugMode: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.isDebugMode = process.env.DEBUG === 'true' || this.isDevelopment;
  }

  /**
   * Generate ISO timestamp for log entries
   * 
   * @returns Current timestamp in ISO format
   */
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Get formatted level prefix for log messages
   * 
   * @param level Log level to format
   * @returns Formatted prefix string
   */
  private getLevelPrefix(level: LogLevel): string {
    const prefixes = {
      debug: '[DEBUG]',
      info: '[INFO]',
      warn: '[WARN]',
      error: '[ERROR]'
    };
    return prefixes[level];
  }

  /**
   * Format log message with timestamp, level, and optional structured data
   * 
   * @param level Log level
   * @param message Primary log message
   * @param data Optional structured data to include
   * @returns Formatted log message string
   */
  private formatMessage(level: LogLevel, message: string, data?: LogData): string {
    const timestamp = this.getTimestamp();
    const prefix = this.getLevelPrefix(level);
    let formattedMessage = `${timestamp} ${prefix} ${message}`;
    
    if (data && Object.keys(data).length > 0) {
      formattedMessage += `\n  Data: ${JSON.stringify(data, null, 2)}`;
    }

    return formattedMessage;
  }

  /**
   * Debug level logging - only shown in development or when DEBUG=true
   * 
   * Used for detailed debugging information that should not appear
   * in production environments unless explicitly enabled.
   * 
   * @param message Debug message to log
   * @param data Optional structured data to include
   */
  debug(message: string, data?: LogData): void {
    if (this.isDebugMode) {
      const formattedMessage = this.formatMessage('debug', message, data);
      console.debug(formattedMessage);
    }
  }

  /**
   * Info level logging - general application information
   * 
   * Used for normal application flow and informational messages
   * that are useful for monitoring and debugging.
   * 
   * @param message Informational message to log
   * @param data Optional structured data to include
   */
  info(message: string, data?: LogData): void {
    const formattedMessage = this.formatMessage('info', message, data);
    console.info(formattedMessage);
  }

  /**
   * Warning level logging - for concerning but non-critical issues
   * 
   * Used for situations that are unusual or potentially problematic
   * but don't prevent the application from continuing.
   * 
   * @param message Warning message to log
   * @param data Optional structured data to include
   */
  warn(message: string, data?: LogData): void {
    const formattedMessage = this.formatMessage('warn', message, data);
    console.warn(formattedMessage);
  }

  /**
   * Error level logging - for errors and exceptions
   * 
   * Used for error conditions that require attention. Automatically
   * includes error object details when provided.
   * 
   * @param message Error message to log
   * @param error Optional error object or unknown error value
   * @param data Optional additional structured data to include
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
   * Context-specific loggers for different application modules
   * 
   * These provide namespaced logging for better organization and filtering
   * of log messages by application area.
   */

  /** Transform route specific logging */
  transform = {
    info: (message: string, data?: LogData) => this.info(`[Transform] ${message}`, data),
    warn: (message: string, data?: LogData) => this.warn(`[Transform] ${message}`, data),
    error: (message: string, error?: Error | unknown, data?: LogData) => this.error(`[Transform] ${message}`, error, data),
    debug: (message: string, data?: LogData) => this.debug(`[Transform] ${message}`, data)
  };

  /** Authentication specific logging */
  auth = {
    info: (message: string, data?: LogData) => this.info(`[Auth] ${message}`, data),
    warn: (message: string, data?: LogData) => this.warn(`[Auth] ${message}`, data),
    error: (message: string, error?: Error | unknown, data?: LogData) => this.error(`[Auth] ${message}`, error, data),
    debug: (message: string, data?: LogData) => this.debug(`[Auth] ${message}`, data)
  };

  /** Database specific logging */
  db = {
    info: (message: string, data?: LogData) => this.info(`[DB] ${message}`, data),
    warn: (message: string, data?: LogData) => this.warn(`[DB] ${message}`, data),
    error: (message: string, error?: Error | unknown, data?: LogData) => this.error(`[DB] ${message}`, error, data),
    debug: (message: string, data?: LogData) => this.debug(`[DB] ${message}`, data)
  };

  /** API specific logging */
  api = {
    info: (message: string, data?: LogData) => this.info(`[API] ${message}`, data),
    warn: (message: string, data?: LogData) => this.warn(`[API] ${message}`, data),
    error: (message: string, error?: Error | unknown, data?: LogData) => this.error(`[API] ${message}`, error, data),
    debug: (message: string, data?: LogData) => this.debug(`[API] ${message}`, data)
  };

  /** OpenAI specific logging */
  openai = {
    info: (message: string, data?: LogData) => this.info(`[OpenAI] ${message}`, data),
    warn: (message: string, data?: LogData) => this.warn(`[OpenAI] ${message}`, data),
    error: (message: string, error?: Error | unknown, data?: LogData) => this.error(`[OpenAI] ${message}`, error, data),
    debug: (message: string, data?: LogData) => this.debug(`[OpenAI] ${message}`, data)
  };

  /** Usage tracking specific logging */
  usage = {
    info: (message: string, data?: LogData) => this.info(`[Usage] ${message}`, data),
    warn: (message: string, data?: LogData) => this.warn(`[Usage] ${message}`, data),
    error: (message: string, error?: Error | unknown, data?: LogData) => this.error(`[Usage] ${message}`, error, data),
    debug: (message: string, data?: LogData) => this.debug(`[Usage] ${message}`, data)
  };

  /** Test specific logging */
  test = {
    info: (message: string, data?: LogData) => this.info(`[Test] ${message}`, data),
    warn: (message: string, data?: LogData) => this.warn(`[Test] ${message}`, data),
    error: (message: string, error?: Error | unknown, data?: LogData) => this.error(`[Test] ${message}`, error, data),
    debug: (message: string, data?: LogData) => this.debug(`[Test] ${message}`, data)
  };

  /** Session specific logging */
  session = {
    info: (message: string, data?: LogData) => this.info(`[Session] ${message}`, data),
    warn: (message: string, data?: LogData) => this.warn(`[Session] ${message}`, data),
    error: (message: string, error?: Error | unknown, data?: LogData) => this.error(`[Session] ${message}`, error, data),
    debug: (message: string, data?: LogData) => this.debug(`[Session] ${message}`, data)
  };

  /** Validation specific logging */
  validation = {
    info: (message: string, data?: LogData) => this.info(`[Validation] ${message}`, data),
    warn: (message: string, data?: LogData) => this.warn(`[Validation] ${message}`, data),
    error: (message: string, error?: Error | unknown, data?: LogData) => this.error(`[Validation] ${message}`, error, data),
    debug: (message: string, data?: LogData) => this.debug(`[Validation] ${message}`, data)
  };
}

/**
 * Singleton logger instance for application-wide use
 */
export const logger = new Logger();

/**
 * Export LogData type for external usage in other modules
 */
export type { LogData };
