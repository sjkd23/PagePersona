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
      const statusCode = result.error?.includes('Messages array is required') ? HttpStatus.BAD_REQUEST :
                        result.error?.includes('invalid role') ? HttpStatus.BAD_REQUEST :
                        result.error?.includes('invalid content') ? HttpStatus.BAD_REQUEST :
                        HttpStatus.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json({ 
        success: false,
        error: result.error || "Unknown error occurred" 
      });
    }

  } catch (error) {
    logger.openai.error('Error in prompt call', error);
    
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      error: "Failed to process chat request. Please try again."
    });
  }
};

export default promptCall;
