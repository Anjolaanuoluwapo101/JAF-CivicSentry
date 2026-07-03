export interface AIProvider {
  generateRiskNarrative(prompt: string): Promise<string>
}
