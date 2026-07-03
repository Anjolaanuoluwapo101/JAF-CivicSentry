import { AIProvider } from './types'
import { GeminiProvider } from './gemini'
import { DeepSeekProvider } from './deepseek'
import { GroqProvider } from './groq'

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'groq'
  switch (provider) {
    case 'deepseek':
      return new DeepSeekProvider()
    case 'gemini':
      return new GeminiProvider()
    default:
      return new GroqProvider()
  }
}

export type { AIProvider }
