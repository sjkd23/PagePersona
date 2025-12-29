/**
 * GPT Communication Route Handler
 *
 * Provides direct access to OpenAI GPT chat functionality with validation
 * and structured message handling. Used for real-time chat interactions
 * and custom AI communication workflows.
 *
 * Routes:
 * - POST /chat: Send messages to OpenAI GPT with validation
 */

import express from "express";
import { validateRequest } from "../middleware/zod-validation";
import { chatMessageSchema } from "../schemas/chat.schema";
import promptCall from "../utils/gpt/prompt-call";

const router = express.Router();

/**
 * Send chat messages to OpenAI GPT
 *
 * Processes validated chat messages and forwards them to the OpenAI GPT
 * service for response generation. Handles message validation and error
 * responses according to OpenAI API specifications.
 *
 * @route POST /chat
 * @param {object} message - Chat message object with role and content
 * @returns {object} GPT response or error message
 * @middleware validateBody - Validates message format using chat schema
 */
router.post("/chat", validateRequest(chatMessageSchema, "body"), promptCall);

export default router;
