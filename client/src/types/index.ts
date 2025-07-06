export interface User {
  id: string
  email: string
  name?: string
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

export interface ApiError {
  message: string
  code?: string
  status?: number
}

export interface LoadingState {
  isLoading: boolean
  error?: string | null
}
