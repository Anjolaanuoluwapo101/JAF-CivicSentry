import { AIProvider } from './types'

export class GroqProvider implements AIProvider {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || ''
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
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content: 'You are a Nigerian election safety intelligence analyst. Provide concise, factual, and actionable risk assessments.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 1024,
          }),
        })

        if (response.status === 429) {
          lastError = new Error('Rate limited by Groq API')
          continue
        }

        if (!response.ok) {
          const body = await response.text()
          throw new Error(`Groq API error: ${response.status} - ${body}`)
        }

        const data = await response.json()
        return data.choices?.[0]?.message?.content || 'Unable to generate risk narrative.'
      } catch (err: any) {
        if (err.message?.includes('429') || err.message?.includes('rate')) {
          lastError = err
          continue
        }
        throw err
      }
    }

    throw lastError || new Error('Groq API rate limit exceeded. Please try again later.')
  }
}
