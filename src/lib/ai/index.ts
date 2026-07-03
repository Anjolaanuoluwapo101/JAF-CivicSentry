import { AIProvider } from './types'
import { GeminiProvider } from './gemini'
import { DeepSeekProvider } from './deepseek'

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'gemini'
  switch (provider) {
    case 'deepseek':
      return new DeepSeekProvider()
    default:
      return new GeminiProvider()
  }
}

export type { AIProvider }
