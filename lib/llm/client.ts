export interface LLMClient {
  generate(prompt: string, systemPrompt: string): Promise<ReadableStream>
}
