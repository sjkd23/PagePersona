/**
 * Shared User types used across client and server
 */

export interface User {
  id: string
  email: string
  name?: string
}

export interface UserProfile {
  id: string
  email: string
  name?: string
  picture?: string
  nickname?: string
  given_name?: string
  family_name?: string
}

export interface ChatMessage {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
}

export interface ConversationHistory {
  id: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}
