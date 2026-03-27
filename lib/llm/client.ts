export interface LLMClient {
  generate(prompt: string, systemPrompt: string): Promise<ReadableStream>
  /** Non-streaming single-turn call. Returns the full response text. */
  text(prompt: string, systemPrompt: string): Promise<string>
}
