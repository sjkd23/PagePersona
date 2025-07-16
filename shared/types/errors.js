/**
 * Comprehensive Error Types and User-Friendly Error Messages
 *
 * This module defines standardized error types and user-friendly messages
 * for consistent error handling across the entire application.
 */
/**
 * Standard error codes used throughout the application
 */
export var ErrorCode;
(function (ErrorCode) {
  // Authentication Errors
  ErrorCode['AUTH_REQUIRED'] = 'AUTH_REQUIRED';
  ErrorCode['AUTH_INVALID'] = 'AUTH_INVALID';
  ErrorCode['AUTH_EXPIRED'] = 'AUTH_EXPIRED';
  // Usage Limit Errors
  ErrorCode['USAGE_LIMIT_EXCEEDED'] = 'USAGE_LIMIT_EXCEEDED';
  ErrorCode['RATE_LIMIT_EXCEEDED'] = 'RATE_LIMIT_EXCEEDED';
  // Validation Errors
  ErrorCode['INVALID_URL'] = 'INVALID_URL';
  ErrorCode['INVALID_TEXT'] = 'INVALID_TEXT';
  ErrorCode['INVALID_PERSONA'] = 'INVALID_PERSONA';
  ErrorCode['TEXT_TOO_LONG'] = 'TEXT_TOO_LONG';
  // Network/Service Errors
  ErrorCode['NETWORK_ERROR'] = 'NETWORK_ERROR';
  ErrorCode['SERVICE_UNAVAILABLE'] = 'SERVICE_UNAVAILABLE';
  ErrorCode['SCRAPING_FAILED'] = 'SCRAPING_FAILED';
  ErrorCode['TRANSFORMATION_FAILED'] = 'TRANSFORMATION_FAILED';
  // User Errors
  ErrorCode['USER_NOT_FOUND'] = 'USER_NOT_FOUND';
  ErrorCode['PROFILE_UPDATE_FAILED'] = 'PROFILE_UPDATE_FAILED';
  // Generic Errors
  ErrorCode['UNKNOWN_ERROR'] = 'UNKNOWN_ERROR';
  ErrorCode['INTERNAL_ERROR'] = 'INTERNAL_ERROR';
})(ErrorCode || (ErrorCode = {}));
/**
 * User-friendly error messages mapped to error codes
 */
export const ERROR_MESSAGES = {
  [ErrorCode.AUTH_REQUIRED]: {
    title: 'Authentication Required',
    message: 'Please log in to use this feature',
    actionText: 'Log In',
    helpText: 'You need to be signed in to transform content',
  },
  [ErrorCode.AUTH_INVALID]: {
    title: 'Invalid Authentication',
    message: 'Your session has expired or is invalid',
    actionText: 'Log In Again',
    helpText: 'Please sign in again to continue',
  },
  [ErrorCode.AUTH_EXPIRED]: {
    title: 'Session Expired',
    message: 'Your session has expired for security reasons',
    actionText: 'Log In Again',
    helpText: 'Please sign in again to continue using the service',
  },
  [ErrorCode.USAGE_LIMIT_EXCEEDED]: {
    title: 'Monthly Limit Reached',
    message: "You've reached your monthly transformation limit",
    actionText: 'Upgrade Plan',
    helpText: 'Upgrade to a premium plan for more transformations per month',
  },
  [ErrorCode.RATE_LIMIT_EXCEEDED]: {
    title: 'Too Many Requests',
    message: 'Please wait a moment before trying again',
    helpText: "You're making requests too quickly. Please slow down a bit",
  },
  [ErrorCode.INVALID_URL]: {
    title: 'Invalid URL',
    message: 'Please enter a valid website URL',
    helpText: 'Make sure the URL starts with http:// or https:// and is accessible',
  },
  [ErrorCode.INVALID_TEXT]: {
    title: 'Invalid Text',
    message: 'Please enter some text to transform',
    helpText: 'The text field cannot be empty',
  },
  [ErrorCode.INVALID_PERSONA]: {
    title: 'No Persona Selected',
    message: 'Please select a persona for transformation',
    helpText: 'Choose from our available personas to style your content',
  },
  [ErrorCode.TEXT_TOO_LONG]: {
    title: 'Text Too Long',
    message: 'Please shorten your text to under the character limit',
    helpText: 'Try breaking your content into smaller chunks',
  },
  [ErrorCode.NETWORK_ERROR]: {
    title: 'Connection Problem',
    message: 'Unable to connect to our servers',
    helpText: 'Check your internet connection and try again',
  },
  [ErrorCode.SERVICE_UNAVAILABLE]: {
    title: 'Service Temporarily Unavailable',
    message: 'Our transformation service is currently down',
    helpText: 'Please try again in a few minutes',
  },
  [ErrorCode.SCRAPING_FAILED]: {
    title: 'Unable to Access Website',
    message: "We couldn't access the content from that website",
    helpText: 'The website might be private, require login, or block automated access',
  },
  [ErrorCode.TRANSFORMATION_FAILED]: {
    title: 'Transformation Failed',
    message: 'Something went wrong while transforming your content',
    helpText: 'Please try again, or contact support if the problem persists',
  },
  [ErrorCode.USER_NOT_FOUND]: {
    title: 'User Not Found',
    message: "We couldn't find your user account",
    actionText: 'Contact Support',
    helpText: 'Please try logging out and back in',
  },
  [ErrorCode.PROFILE_UPDATE_FAILED]: {
    title: 'Profile Update Failed',
    message: "We couldn't save your profile changes",
    helpText: 'Please check your input and try again',
  },
  [ErrorCode.UNKNOWN_ERROR]: {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred',
    helpText: 'Please try again, or contact support if the problem continues',
  },
  [ErrorCode.INTERNAL_ERROR]: {
    title: 'Internal Server Error',
    message: 'Our servers encountered an issue',
    helpText: 'This is not your fault. Please try again in a few minutes',
  },
};
/**
 * Error mapping utilities
 */
export class ErrorMapper {
  /**
   * Maps a generic error to a user-friendly error with appropriate code
   */
  static mapError(error) {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      // Map common error patterns to specific error codes
      if (message.includes('usage limit') || message.includes('monthly limit')) {
        return this.createError(ErrorCode.USAGE_LIMIT_EXCEEDED);
      }
      if (message.includes('rate limit') || message.includes('too many requests')) {
        return this.createError(ErrorCode.RATE_LIMIT_EXCEEDED);
      }
      if (message.includes('invalid url') || message.includes('malformed url')) {
        return this.createError(ErrorCode.INVALID_URL);
      }
      if (message.includes('scraping failed') || message.includes('failed to fetch')) {
        return this.createError(ErrorCode.SCRAPING_FAILED);
      }
      if (message.includes('network') || message.includes('connection')) {
        return this.createError(ErrorCode.NETWORK_ERROR);
      }
      if (message.includes('unauthorized') || message.includes('authentication')) {
        return this.createError(ErrorCode.AUTH_INVALID);
      }
      if (message.includes('user not found')) {
        return this.createError(ErrorCode.USER_NOT_FOUND);
      }
    }
    // Default to unknown error
    return this.createError(ErrorCode.UNKNOWN_ERROR);
  }
  /**
   * Maps usage limit error with specific details
   */
  static mapUsageLimitError(details) {
    const error = this.createError(ErrorCode.USAGE_LIMIT_EXCEEDED);
    return {
      ...error,
      currentUsage: details.currentUsage,
      usageLimit: details.usageLimit,
      membership: details.membership,
      upgradeUrl: '/pricing',
    };
  }
  /**
   * Maps rate limit error with retry information
   */
  static mapRateLimitError(retryAfter, penaltyDuration) {
    const error = this.createError(ErrorCode.RATE_LIMIT_EXCEEDED);
    return {
      ...error,
      retryAfter,
      penaltyDuration,
    };
  }
  /**
   * Creates a user-friendly error from an error code
   */
  static createError(code) {
    const errorInfo = ERROR_MESSAGES[code];
    return {
      code,
      title: errorInfo.title,
      message: errorInfo.message,
      actionText: errorInfo.actionText,
      helpText: errorInfo.helpText,
      timestamp: new Date(),
    };
  }
}
