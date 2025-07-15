/**
 * User Type Definitions
 *
 * Defines user-related data structures used across the application.
 * These types handle user authentication, profile information, and chat functionality.
 */

/**
 * Core user object representing an authenticated user.
 * Contains minimal required fields for user identification and basic operations.
 */
export interface User {
  /** Unique user identifier */
  id: string;
  /** User's email address (required for authentication) */
  email: string;
  /** Optional display name */
  name?: string;
}

/**
 * Extended user profile containing additional Auth0 and social profile data.
 * Used for rich user displays and profile management features.
 */
export interface UserProfile {
  /** Unique user identifier */
  id: string;
  /** Primary email address */
  email: string;
  /** Full display name */
  name?: string;
  /** Profile picture URL */
  picture?: string;
  /** Short username or handle */
  nickname?: string;
  /** First name */
  given_name?: string;
  /** Last name */
  family_name?: string;
}

/**
 * Individual chat message within a conversation.
 * Represents a single exchange between user and system.
 */
export interface ChatMessage {
  /** Unique message identifier */
  id: string;
  /** Message text content */
  content: string;
  /** True if message is from user, false if from system/AI */
  isUser: boolean;
  /** When the message was created */
  timestamp: Date;
}

/**
 * Complete conversation thread containing multiple messages.
 * Tracks the full context of a user's chat session.
 */
export interface ConversationHistory {
  /** Unique conversation identifier */
  id: string;
  /** Ordered list of messages in the conversation */
  messages: ChatMessage[];
  /** When the conversation was started */
  createdAt: Date;
  /** When the conversation was last modified */
  updatedAt: Date;
}
