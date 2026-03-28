import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'

const VALID_FEEDBACK = ['thumbs_up', 'thumbs_down'] as const
type Feedback = (typeof VALID_FEEDBACK)[number]

export async function POST(req: NextRequest) {
  let body: { generationId?: unknown; feedback?: unknown }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { generationId, feedback } = body

  if (!generationId || typeof generationId !== 'string') {
    return Response.json({ error: 'generationId is required' }, { status: 422 })
  }
  if (!feedback || !VALID_FEEDBACK.includes(feedback as Feedback)) {
    return Response.json({ error: `feedback must be one of: ${VALID_FEEDBACK.join(', ')}` }, { status: 422 })
  }

  try {
    const updated = await prisma.generation.update({
      where: { id: generationId },
      data: { feedback: feedback as string },
      select: { id: true, feedback: true },
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
