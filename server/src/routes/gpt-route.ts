import express from 'express';
import { validateBody } from '../middleware/zod-validation';
import { chatSchemas } from '../middleware/validation-schemas';
import promptCall from '../utils/gpt/prompt-call';

const router = express.Router();

// POST /api/gpt/chat - Send messages to OpenAI GPT
router.post('/chat', validateBody(chatSchemas.chatMessage), promptCall);

export default router;
