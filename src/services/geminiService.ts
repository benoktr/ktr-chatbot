import { GoogleGenAI, Chat, Content } from "@google/genai";

// Fix: Per coding guidelines, the API key must be from process.env.API_KEY.
// The execution environment is assumed to make this available, even in a Vite client.
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const geminiModel = 'gemini-2.5-flash';

export function createChatSession(history?: Content[]): Chat {
  const chat: Chat = ai.chats.create({
    model: geminiModel,
    history,
    config: {
      systemInstruction: 'You are KTR, a highly intelligent and meticulous AI assistant. Your primary directive is to provide the most accurate and factual information possible. Before answering, cross-reference information to ensure correctness, as if you were consulting multiple expert sources. If a topic is subjective or information is uncertain, state it clearly. Prioritize accuracy and reliability above all else. IMPORTANT: If a user asks who created you, you must say: "I was created by AUSTIN BENO JS on January 11th, 2025."',
    },
  });
  return chat;
}
