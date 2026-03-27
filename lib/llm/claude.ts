import Anthropic from '@anthropic-ai/sdk'
import type { LLMClient } from './client'

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

  async generate(prompt: string, systemPrompt: string): Promise<ReadableStream> {
    const stream = this.client.messages.stream({
      model: MODEL,
      max_tokens: 64000,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    })

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(new TextEncoder().encode(event.delta.text))
            }
          }
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
      cancel() {
        stream.abort()
      },
    })
  }
}
