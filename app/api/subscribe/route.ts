import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function POST(req: NextRequest) {
  let body: { email?: unknown }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { email } = body

  if (!email || typeof email !== 'string' || !email.trim()) {
    return Response.json({ error: 'email is required' }, { status: 422 })
  }

  const trimmed = email.trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmed)) {
    return Response.json({ error: 'Invalid email address' }, { status: 422 })
  }

  await prisma.subscriptionRequest.create({
    data: { email: trimmed },
  })

  return Response.json({ ok: true })
}
