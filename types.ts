
import { Content } from '@google/genai';

export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  ERROR = 'error',
}

export interface ChatMessage {
  role: MessageRole;
  text: string;
  imageUrl?: string;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  history: Content[];
}
