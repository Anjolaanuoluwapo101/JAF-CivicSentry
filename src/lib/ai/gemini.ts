import { AIProvider } from './types'

export class GeminiProvider implements AIProvider {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || ''
  }

  async generateRiskNarrative(prompt: string): Promise<string> {
    const maxRetries = 3
    let lastError: Error | null = null

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000
        await new Promise((r) => setTimeout(r, delay))
      }

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
              },
            }),
          }
        )

        if (response.status === 429) {
          lastError = new Error('Rate limited by Gemini API')
          continue
        }

        if (!response.ok) {
          throw new Error(`Gemini API error: ${response.status}`)
        }

        const data = await response.json()
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate risk narrative.'
      } catch (err: any) {
        if (err.message?.includes('429')) {
          lastError = err
          continue
        }
        throw err
      }
    }

    throw lastError || new Error('Gemini API rate limit exceeded. Please try again later.')
  }
}
