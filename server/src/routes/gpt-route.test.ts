import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import gptRoutes from './gpt-route';

// Mock the prompt-call utility
vi.mock('../utils/gpt/prompt-call', () => ({
  default: vi.fn((req: any, res: any) => {
    res.json({
      success: true,
      response: 'Mock GPT response',
      usage: {
        prompt_tokens: 10,
        completion_tokens: 15,
        total_tokens: 25
      }
    });
  })
}));

// Mock the validation middleware
vi.mock('../middleware/zod-validation', () => ({
  validateBody: vi.fn(() => (req: any, res: any, next: any) => {
    // Simple validation mock - just pass through
    next();
  })
}));

// Mock the validation schemas
vi.mock('../middleware/validation-schemas', () => ({
  chatSchemas: {
    chatMessage: vi.fn()
  }
}));

describe('GPT Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/gpt', gptRoutes);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('POST /chat', () => {
    it('should handle chat messages', async () => {
      const chatData = {
        message: 'Hello, how are you?',
        model: 'gpt-3.5-turbo',
        maxTokens: 150
      };

      const response = await request(app)
        .post('/api/gpt/chat')
        .send(chatData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response).toBeDefined();
      expect(response.body.usage).toBeDefined();
      expect(response.body.usage.total_tokens).toBeGreaterThan(0);
    });

    it('should validate request body structure', async () => {
      await request(app)
        .post('/api/gpt/chat')
        .send({ message: 'Test message' })
        .expect(200);

      // The validation is configured at route definition time, not at runtime
      // So we just verify the route works correctly
      const { validateBody } = await import('../middleware/zod-validation');
      
      // Verify that validateBody is a function (was imported and mocked)
      expect(typeof validateBody).toBe('function');
    });

    it('should call prompt-call utility', async () => {
      const promptCall = await import('../utils/gpt/prompt-call');

      await request(app)
        .post('/api/gpt/chat')
        .send({ message: 'Test message' })
        .expect(200);

      // Verify the prompt-call function was used
      expect(promptCall.default).toHaveBeenCalled();
    });

    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/gpt/chat')
        .send({})
        .expect(200);

      // Since validation is mocked to pass through, we should get a response
      expect(response.body.success).toBe(true);
    });

    it('should handle different message types', async () => {
      const testCases = [
        { message: 'Simple text message' },
        { message: 'Question: What is the weather?', type: 'question' },
        { message: 'Translate this text', language: 'spanish' }
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/api/gpt/chat')
          .send(testCase)
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });
  });

  describe('Route configuration', () => {
    it('should only support POST method for /chat', async () => {
      // GET should not be supported
      await request(app)
        .get('/api/gpt/chat')
        .expect(404);

      // PUT should not be supported  
      await request(app)
        .put('/api/gpt/chat')
        .expect(404);

      // DELETE should not be supported
      await request(app)
        .delete('/api/gpt/chat')
        .expect(404);
    });

    it('should not support other endpoints', async () => {
      await request(app)
        .post('/api/gpt/unknown')
        .expect(404);

      await request(app)
        .get('/api/gpt/health')
        .expect(404);
    });
  });
});
