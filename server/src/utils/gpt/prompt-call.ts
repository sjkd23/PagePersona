import { Request, Response } from "express";
import { HttpStatus } from "../../constants/http-status";
import { createChatService } from "../../services/chat-service";
import { logger } from "../../utils/logger";

const promptCall = async (req: Request, res: Response): Promise<void> => {
  logger.openai.info('ChatGPT prompt call started');
  
  try {
    const chatService = createChatService();
    const result = await chatService.sendChatMessages(req.body);

    if (result.success) {
      res.status(HttpStatus.OK).json({
        success: true,
        message: result.message,
        usage: result.usage,
      });
    } else {
      // Determine status code based on error type
      const isValidationError = result.error?.includes('Messages array is required') ||
                              result.error?.includes('invalid role') ||
                              result.error?.includes('invalid content') ||
                              result.error?.includes('invalid object');
      
      const statusCode = isValidationError ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR;
      
      // Format response based on error type
      if (result.error?.includes('No response generated')) {
        res.status(statusCode).json({ 
          success: false,
          error: "No response generated"
        });
      } else if (result.error?.includes('OpenAI API Error')) {
        // Format OpenAI API errors with details as expected by tests
        res.status(statusCode).json({ 
          success: false,
          error: "Internal server error",
          details: result.error
        });
      } else {
        res.status(statusCode).json({ 
          success: false,
          error: result.error || "Unknown error occurred" 
        });
      }
    }

  } catch (error) {
    logger.openai.error('Error in prompt call', error);
    
    // Check if this is an API key error
    if (error instanceof Error && error.message.includes('OpenAI API key is not configured')) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ 
        success: false,
        error: "OpenAI API key is not configured" 
      });
    } else if (error instanceof Error) {
      // For other errors, return the format expected by tests
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ 
        success: false,
        error: "Internal server error",
        details: error.message
      });
    } else {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ 
        success: false,
        error: "Failed to process chat request. Please try again."
      });
    }
  }
};

export default promptCall;
