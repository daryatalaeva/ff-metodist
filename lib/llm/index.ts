import type { LLMClient } from './client'
import { ClaudeClient } from './claude'
import { GigaChatClient } from './gigachat'

export type LLMProvider = 'claude' | 'gigachat'

export function getLLMClient(): LLMClient {
  const provider = (process.env.LLM_PROVIDER ?? 'claude') as LLMProvider

  switch (provider) {
    case 'gigachat':
      return new GigaChatClient()
    case 'claude':
    default:
      return new ClaudeClient()
  }
}

export type { LLMClient } from './client'
