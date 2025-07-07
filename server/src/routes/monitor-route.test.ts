import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import monitorRoutes from './monitor-route';

// Mock the utility functions
vi.mock('../utils/env-validation', () => ({
  getEnvironmentInfo: vi.fn(() => ({
    auth0: {
      domain: 'test-domain.auth0.com',
      clientId: 'test-client-id',
      audience: 'test-audience'
    },
    database: {
      status: 'connected',
      name: 'test-db'
    },
    redis: {
      status: 'connected',
      host: 'localhost'
    }
  }))
}));

vi.mock('../middleware/jwt-verification', () => ({
  getJwtInfo: vi.fn(() => ({
    algorithm: 'RS256',
    issuer: 'https://test-domain.auth0.com/',
    audience: 'test-audience',
    keySource: 'jwks'
  }))
}));

vi.mock('../utils/session-tracker', () => ({
  getSessionStats: vi.fn(() => ({
    activeSessions: 15,
    totalSessions: 1250,
    averageSessionDuration: 1800,
    peakConcurrentSessions: 45,
    sessionsByHour: {
      '12': 5,
      '13': 8,
      '14': 12
    }
  }))
}));

describe('Monitor Routes', () => {
  let app: express.Application;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/monitor', monitorRoutes);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/monitor/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
      expect(response.body.memory).toBeDefined();
      expect(response.body.version).toBeDefined();
    });

    it('should include process memory information', async () => {
      const response = await request(app)
        .get('/api/monitor/health')
        .expect(200);

      expect(response.body.memory).toHaveProperty('rss');
      expect(response.body.memory).toHaveProperty('heapTotal');
      expect(response.body.memory).toHaveProperty('heapUsed');
      expect(response.body.memory).toHaveProperty('external');
    });

    it('should work in production environment', async () => {
      process.env.NODE_ENV = 'production';
      
      const response = await request(app)
        .get('/api/monitor/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
    });
  });

  describe('Development/Staging endpoints', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    describe('GET /auth0', () => {
      it('should return Auth0 configuration in non-production', async () => {
        const response = await request(app)
          .get('/api/monitor/auth0')
          .expect(200);

        expect(response.body.environment).toBeDefined();
        expect(response.body.jwt).toBeDefined();
        expect(response.body.timestamp).toBeDefined();
        expect(response.body.environment.auth0).toHaveProperty('domain');
        expect(response.body.jwt).toHaveProperty('algorithm', 'RS256');
      });

      it('should call environment and JWT info utilities', async () => {
        const { getEnvironmentInfo } = await import('../utils/env-validation');
        const { getJwtInfo } = await import('../middleware/jwt-verification');

        await request(app)
          .get('/api/monitor/auth0')
          .expect(200);

        expect(getEnvironmentInfo).toHaveBeenCalled();
        expect(getJwtInfo).toHaveBeenCalled();
      });
    });

    describe('GET /sessions', () => {
      it('should return session statistics in non-production', async () => {
        const response = await request(app)
          .get('/api/monitor/sessions')
          .expect(200);

        expect(response.body.activeSessions).toBe(15);
        expect(response.body.totalSessions).toBe(1250);
        expect(response.body.averageSessionDuration).toBe(1800);
        expect(response.body.timestamp).toBeDefined();
      });

      it('should call session stats utility', async () => {
        const { getSessionStats } = await import('../utils/session-tracker');

        await request(app)
          .get('/api/monitor/sessions')
          .expect(200);

        expect(getSessionStats).toHaveBeenCalled();
      });
    });
  });

  describe('Production environment restrictions', () => {
    it('should not expose Auth0 config in production', async () => {
      // Create a new app with production environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      // Clear module cache and reimport the route
      vi.resetModules();
      const productionMonitorRoutes = await import('./monitor-route');
      
      const productionApp = express();
      productionApp.use(express.json());
      productionApp.use('/api/monitor', productionMonitorRoutes.default);
      
      const response = await request(productionApp)
        .get('/api/monitor/auth0')
        .expect(404);
      
      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should not expose session stats in production', async () => {
      // Create a new app with production environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      // Clear module cache and reimport the route
      vi.resetModules();
      const productionMonitorRoutes = await import('./monitor-route');
      
      const productionApp = express();
      productionApp.use(express.json());
      productionApp.use('/api/monitor', productionMonitorRoutes.default);
      
      const response = await request(productionApp)
        .get('/api/monitor/sessions')
        .expect(404);
      
      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should still allow health checks in production', async () => {
      const response = await request(app)
        .get('/api/monitor/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
    });
  });

  describe('Endpoint validation', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should not support non-existent endpoints', async () => {
      await request(app)
        .get('/api/monitor/unknown')
        .expect(404);
    });

    it('should only support GET methods', async () => {
      await request(app)
        .post('/api/monitor/health')
        .expect(404);

      await request(app)
        .put('/api/monitor/auth0')
        .expect(404);

      await request(app)
        .delete('/api/monitor/sessions')
        .expect(404);
    });
  });
});
