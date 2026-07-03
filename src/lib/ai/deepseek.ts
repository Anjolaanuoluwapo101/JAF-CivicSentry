import { AIProvider } from './types'

export class DeepSeekProvider implements AIProvider {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || ''
  }

  async generateRiskNarrative(prompt: string): Promise<string> {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || 'Unable to generate risk narrative.'
  }
}
