export interface ChatPart {
  text: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface GeminiMessage {
  role: 'model' | 'user'
  parts: ChatPart[]
}

export interface ErrorMessage {
  code: string
  message: string
}
