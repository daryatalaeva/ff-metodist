import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'

const VALID_ACTIONS = ['copied', 'downloaded', 'regenerated'] as const
type Action = (typeof VALID_ACTIONS)[number]

const ACTION_FIELD: Record<Action, 'wasCopied' | 'wasDownloaded' | 'wasRegenerated'> = {
  copied: 'wasCopied',
  downloaded: 'wasDownloaded',
  regenerated: 'wasRegenerated',
}

export async function POST(req: NextRequest) {
  let body: { generationId?: unknown; action?: unknown }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { generationId, action } = body

  if (!generationId || typeof generationId !== 'string') {
    return Response.json({ error: 'generationId is required' }, { status: 422 })
  }
  if (!action || !VALID_ACTIONS.includes(action as Action)) {
    return Response.json(
      { error: `action must be one of: ${VALID_ACTIONS.join(', ')}` },
      { status: 422 },
    )
  }

  const field = ACTION_FIELD[action as Action]

  try {
    const updated = await prisma.generation.update({
      where: { id: generationId },
      data: { [field]: true },
      select: { id: true, wasCopied: true, wasDownloaded: true, wasRegenerated: true },
    })
    return Response.json(updated)
  } catch (err: unknown) {
    if (isNotFound(err)) {
      return Response.json({ error: 'Generation not found' }, { status: 404 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function isNotFound(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === 'P2025'
  )
}
