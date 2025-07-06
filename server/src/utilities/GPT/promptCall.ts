import OpenAI from "openai";
import { Request, Response } from "express";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface PromptCallOptions {
  messages: ChatMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

const promptCall = async (req: Request, res: Response): Promise<void> => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      res.status(500).json({ 
        success: false,
        error: "OpenAI API key is not configured" 
      });
      return;
    }

    const openai = new OpenAI({
      apiKey,
    });

    // Extract options from request body
    const { 
      messages, 
      model = "gpt-4o-mini", 
      maxTokens = 1000,
      temperature = 0.7 
    }: PromptCallOptions = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ 
        success: false,
        error: "Messages array is required and cannot be empty" 
      });
      return;
    }

    const completion = await openai.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
      store: true,
    });

    if (!completion.choices || completion.choices.length === 0) {
      res.status(500).json({ 
        success: false,
        error: "No response generated" 
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: completion.choices[0].message.content,
      usage: completion.usage,
    });

  } catch (error) {
    console.error("Error in promptCall:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export default promptCall;