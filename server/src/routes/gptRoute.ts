import express from 'express';
import promptCall from '../utilities/GPT/promptCall';

const router = express.Router();

// POST /api/gpt/chat - Send messages to OpenAI GPT
router.post('/chat', promptCall);

export default router;
