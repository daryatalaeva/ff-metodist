import Anthropic from '@anthropic-ai/sdk'
import type { LLMClient, LLMStreamResult, LLMUsage } from './client'

const MODEL = 'claude-sonnet-4-20250514'

export class ClaudeClient implements LLMClient {
  private client: Anthropic

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }

  async text(prompt: string, systemPrompt: string): Promise<string> {
    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: 256,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    })
    const block = response.content.find((b) => b.type === 'text')
    return block?.type === 'text' ? block.text : ''
  }

  async generate(prompt: string, systemPrompt: string): Promise<LLMStreamResult> {
    return this._stream(systemPrompt, [
      { role: 'user', content: prompt },
    ])
  }

  async generateWithFile(
    prompt: string,
    systemPrompt: string,
    fileUrl: string,
    mimeType: string,
  ): Promise<LLMStreamResult> {
    const fileResponse = await fetch(fileUrl)
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file for document context: ${fileResponse.status}`)
    }
    const buffer = await fileResponse.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    // Claude's document block only supports 'application/pdf' as media_type.
    // For DOCX and other formats we fall back to a plain generate() call —
    // the prompt already contains the textbook-context instruction via hasFile: true.
    if (mimeType !== 'application/pdf') {
      return this._stream(systemPrompt, [{ role: 'user', content: prompt }])
    }

    return this._stream(systemPrompt, [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf' as const,
              data: base64,
            },
          },
          { type: 'text', text: prompt },
        ],
      },
    ])
  }

  private _stream(
    systemPrompt: string,
    messages: Anthropic.MessageParam[],
  ): LLMStreamResult {
    let resolveUsage!: (u: LLMUsage | null) => void
    const usage = new Promise<LLMUsage | null>((resolve) => {
      resolveUsage = resolve
    })

    const apiStream = this.client.messages.stream({
      model: MODEL,
      max_tokens: 64000,
      system: systemPrompt,
      messages,
    })

    let inputTokens = 0
    let outputTokens = 0

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of apiStream) {
            if (event.type === 'message_start') {
              inputTokens = event.message.usage.input_tokens
            } else if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(new TextEncoder().encode(event.delta.text))
            } else if (event.type === 'message_delta') {
              outputTokens = event.usage.output_tokens
            }
          }
          resolveUsage({ promptTokens: inputTokens, completionTokens: outputTokens })
          controller.close()
        } catch (err) {
          resolveUsage(null)
          controller.error(err)
        }
      },
      cancel() {
        apiStream.abort()
        resolveUsage(null)
      },
    })

    return { stream, usage }
  }
}
