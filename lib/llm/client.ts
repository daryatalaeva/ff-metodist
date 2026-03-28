export interface LLMUsage {
  promptTokens: number
  completionTokens: number
}

export interface LLMStreamResult {
  stream: ReadableStream
  /** Resolves with token counts after the stream is fully consumed. */
  usage: Promise<LLMUsage | null>
}

export interface LLMClient {
  /** Streaming call. Returns a stream of text chunks + a deferred usage promise. */
  generate(prompt: string, systemPrompt: string): Promise<LLMStreamResult>
  /**
   * Streaming call with an attached file document (PDF or DOCX).
   * fileUrl  — publicly accessible URL (e.g. from Vercel Blob)
   * mimeType — MIME type of the file (e.g. 'application/pdf')
   */
  generateWithFile(
    prompt: string,
    systemPrompt: string,
    fileUrl: string,
    mimeType: string,
  ): Promise<LLMStreamResult>
  /** Non-streaming single-turn call. Returns the full response text. */
  text(prompt: string, systemPrompt: string): Promise<string>
}
