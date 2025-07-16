import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '../logger';

describe('utils/logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock console methods
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('basic logging methods', () => {
    it('should log info messages', () => {
      logger.info('Test info message');
      expect(console.info).toHaveBeenCalledWith('ℹ️  [INFO]', 'Test info message');
    });

    it('should log warn messages', () => {
      logger.warn('Test warning message');
      expect(console.warn).toHaveBeenCalledWith('⚠️  [WARN]', 'Test warning message');
    });

    it('should log error messages', () => {
      logger.error('Test error message');
      expect(console.error).toHaveBeenCalledWith('❌ [ERROR]', 'Test error message');
    });

    it('should log error messages with error object', () => {
      const error = new Error('Test error');
      logger.error('Test error message', error);
      expect(console.error).toHaveBeenCalledWith('❌ [ERROR]', 'Test error message', error);
    });

    it('should handle additional arguments', () => {
      logger.info('Test message', { data: 'test' }, 123);
      expect(console.info).toHaveBeenCalledWith(
        'ℹ️  [INFO]',
        'Test message',
        { data: 'test' },
        123,
      );
    });
  });

  describe('component logging', () => {
    it('should log component info with component name', () => {
      logger.component.info('Header', 'Component mounted');
      expect(console.info).toHaveBeenCalledWith('ℹ️  [INFO]', '[Header] Component mounted');
    });

    it('should log component errors with component name', () => {
      const error = new Error('Component error');
      logger.component.error('Header', 'Component failed', error);
      expect(console.error).toHaveBeenCalledWith('❌ [ERROR]', '[Header] Component failed', error);
    });

    it('should log component warnings with component name', () => {
      logger.component.warn('Header', 'Component warning');
      expect(console.warn).toHaveBeenCalledWith('⚠️  [WARN]', '[Header] Component warning');
    });
  });

  describe('API logging', () => {
    it('should log API info with API prefix', () => {
      logger.api.info('Request started');
      expect(console.info).toHaveBeenCalledWith('ℹ️  [INFO]', '[API] Request started');
    });

    it('should log API errors with API prefix', () => {
      const error = new Error('API error');
      logger.api.error('Request failed', error);
      expect(console.error).toHaveBeenCalledWith('❌ [ERROR]', '[API] Request failed', error);
    });
  });

  describe('Auth logging', () => {
    it('should log auth info with Auth prefix', () => {
      logger.auth.info('User logged in');
      expect(console.info).toHaveBeenCalledWith('ℹ️  [INFO]', '[Auth] User logged in');
    });

    it('should log auth errors with Auth prefix', () => {
      const error = new Error('Auth error');
      logger.auth.error('Login failed', error);
      expect(console.error).toHaveBeenCalledWith('❌ [ERROR]', '[Auth] Login failed', error);
    });
  });

  describe('Sync logging', () => {
    it('should log sync info with Sync prefix', () => {
      logger.sync.info('Sync started');
      expect(console.info).toHaveBeenCalledWith('ℹ️  [INFO]', '[Sync] Sync started');
    });

    it('should log sync errors with Sync prefix', () => {
      const error = new Error('Sync error');
      logger.sync.error('Sync failed', error);
      expect(console.error).toHaveBeenCalledWith('❌ [ERROR]', '[Sync] Sync failed', error);
    });
  });

  describe('debug logging', () => {
    it('should call console.debug when in debug mode', () => {
      // Mock environment to enable debug
      Object.defineProperty(import.meta, 'env', {
        value: { DEV: true },
        writable: true,
      });

      logger.debug('Debug message');
      expect(console.debug).toHaveBeenCalledWith('🐛 [DEBUG]', 'Debug message');
    });

    it('should support debug logging for components', () => {
      logger.component.debug('Header', 'Debug info');
      expect(console.debug).toHaveBeenCalledWith('🐛 [DEBUG]', '[Header] Debug info');
    });
  });

  describe('level prefixes', () => {
    it('should use correct prefixes for each log level', () => {
      logger.info('info');
      logger.warn('warn');
      logger.error('error');

      expect(console.info).toHaveBeenCalledWith('ℹ️  [INFO]', 'info');
      expect(console.warn).toHaveBeenCalledWith('⚠️  [WARN]', 'warn');
      expect(console.error).toHaveBeenCalledWith('❌ [ERROR]', 'error');
    });
  });
});
