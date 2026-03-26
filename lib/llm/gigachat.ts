import type { LLMClient } from './client'
import https from 'node:https'
import { randomUUID } from 'node:crypto'

const TOKEN_URL = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth'
const CHAT_URL = 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions'
const MODEL = 'GigaChat'

// Per-request agent with TLS verification disabled for GigaChat's self-signed cert.
// This does NOT affect the rest of the application.
const GIGACHAT_AGENT = new https.Agent({ rejectUnauthorized: false })

/* ─── Token cache ─── */

interface TokenCache {
  access_token: string
  expires_at: number // Unix ms timestamp from GigaChat
}

let tokenCache: TokenCache | null = null

async function getAccessToken(): Promise<string> {
  // Refresh 60 s before expiry to avoid race conditions
  if (tokenCache && tokenCache.expires_at > Date.now() + 60_000) {
    return tokenCache.access_token
  }

  const authKey = process.env.GIGACHAT_AUTH_KEY
  if (!authKey) {
    throw new Error('GIGACHAT_AUTH_KEY must be set in .env')
  }

  const data = await httpsJson<{ access_token: string; expires_at: number }>(
    TOKEN_URL,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authKey}`,
        RqUID: randomUUID(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'scope=GIGACHAT_API_PERS',
    },
  )

  tokenCache = data
  return data.access_token
}

/* ─── Generic HTTPS JSON helper (uses GIGACHAT_AGENT) ─── */

function httpsJson<T>(
  url: string,
  opts: { method: string; headers: Record<string, string>; body?: string },
): Promise<T> {
  return new Promise((resolve, reject) => {
    const { hostname, port, pathname, search } = new URL(url)
    const contentLength = opts.body ? Buffer.byteLength(opts.body) : 0

    const req = https.request(
      {
        hostname,
        port: port || 443,
        path: pathname + search,
        method: opts.method,
        headers: {
          ...opts.headers,
          ...(opts.body ? { 'Content-Length': contentLength } : {}),
        },
        agent: GIGACHAT_AGENT,
      },
      (res) => {
        let raw = ''
        res.on('data', (chunk: Buffer) => { raw += chunk.toString('utf-8') })
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw) as T
            if ((res.statusCode ?? 200) >= 400) {
              reject(new Error(`GigaChat token request failed (${res.statusCode}): ${raw}`))
            } else {
              resolve(parsed)
            }
          } catch {
            reject(new Error(`GigaChat: failed to parse JSON response: ${raw}`))
          }
        })
        res.on('error', reject)
      },
    )

    req.on('error', reject)
    if (opts.body) req.write(opts.body)
    req.end()
  })
}

/* ─── Streaming HTTPS helper ─── */

function httpsStream(
  url: string,
  opts: { headers: Record<string, string>; body: string },
): Promise<import('node:http').IncomingMessage> {
  return new Promise((resolve, reject) => {
    const { hostname, port, pathname } = new URL(url)
    const contentLength = Buffer.byteLength(opts.body)

    const req = https.request(
      {
        hostname,
        port: port || 443,
        path: pathname,
        method: 'POST',
        headers: {
          ...opts.headers,
          'Content-Length': contentLength,
        },
        agent: GIGACHAT_AGENT,
      },
      (res) => {
        if ((res.statusCode ?? 200) >= 400) {
          let raw = ''
          res.on('data', (c: Buffer) => { raw += c.toString('utf-8') })
          res.on('end', () =>
            reject(new Error(`GigaChat chat error (${res.statusCode}): ${raw}`)),
          )
          return
        }
        resolve(res)
      },
    )

    req.on('error', reject)
    req.write(opts.body)
    req.end()
  })
}

/* ─── GigaChatClient ─── */

export class GigaChatClient implements LLMClient {
  async generate(prompt: string, systemPrompt: string): Promise<ReadableStream> {
    const accessToken = await getAccessToken()

    const body = JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      stream: true,
    })

    const res = await httpsStream(CHAT_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body,
    })

    return new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()
        let buffer = ''
        let closed = false

        function safeClose() {
          if (!closed) {
            closed = true
            controller.close()
          }
        }

        res.on('data', (chunk: Buffer) => {
          if (closed) return
          buffer += chunk.toString('utf-8')
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data:')) continue

            const raw = trimmed.slice(5).trim()
            if (raw === '[DONE]') {
              safeClose()
              return
            }

            try {
              const event = JSON.parse(raw) as {
                choices: Array<{
                  delta: { content?: string }
                  finish_reason?: string | null
                }>
              }
              const content = event.choices[0]?.delta?.content
              if (content) {
                controller.enqueue(encoder.encode(content))
              }
              if (event.choices[0]?.finish_reason === 'stop') {
                safeClose()
              }
            } catch {
              // ignore malformed SSE line
            }
          }
        })

        res.on('end', safeClose)
        res.on('error', (err) => {
          if (!closed) {
            closed = true
            controller.error(err)
          }
        })
      },
    })
  }
}
