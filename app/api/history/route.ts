import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'

const KNOWN_TYPES = ['quiz', 'lesson_plan'] as const

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const subject     = searchParams.get('subject')
  const grade       = searchParams.get('grade')
  const dateFrom    = searchParams.get('dateFrom')
  const dateTo      = searchParams.get('dateTo')
  const featureType = searchParams.get('featureType') // 'quiz' | 'lesson_plan' | null → all

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}

  if (featureType && (KNOWN_TYPES as readonly string[]).includes(featureType)) {
    where.featureType = featureType
  } else {
    where.featureType = { in: [...KNOWN_TYPES] }
  }

  if (subject) where.subject = subject
  if (grade)   where.grade   = parseInt(grade)
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt.gte = new Date(dateFrom)
    if (dateTo) {
      const to = new Date(dateTo)
      to.setDate(to.getDate() + 1)
      where.createdAt.lt = to
    }
  }

  const rawGenerations = await prisma.generation.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id:           true,
      featureType:  true,
      subject:      true,
      grade:        true,
      topic:        true,
      examFormat:   true,
      questionCount:true,
      questionTypes:true,
      lessonType:   true,
      lessonForm:   true,
      lessonDuration:true,
      feedback:     true,
      createdAt:    true,
      resultJson:   true,
    },
  })

  const generations = rawGenerations
    .filter((g) => g.resultJson !== null)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ resultJson: _dropped, ...rest }) => rest)

  // Filter options aggregate across all known types (independent of current featureType filter)
  const all = await prisma.generation.findMany({
    where: { featureType: { in: [...KNOWN_TYPES] } },
    select: { subject: true, grade: true, resultJson: true },
  })
  const successful = all.filter((g) => g.resultJson !== null)
  const subjects = Array.from(
    new Set(successful.map((g) => g.subject).filter((s): s is string => s !== null)),
  ).sort()
  const grades = Array.from(
    new Set(successful.map((g) => g.grade).filter((g): g is number => g !== null)),
  ).sort((a, b) => a - b)

  return Response.json({ generations, subjects, grades })
}
