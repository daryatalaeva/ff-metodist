import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const subject = searchParams.get('subject')
  const grade = searchParams.get('grade')
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { featureType: 'quiz' }

  if (subject) where.subject = subject
  if (grade) where.grade = parseInt(grade)
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt.gte = new Date(dateFrom)
    if (dateTo) {
      const to = new Date(dateTo)
      to.setDate(to.getDate() + 1)
      where.createdAt.lt = to
    }
  }

  // Fetch with resultJson so we can filter out failed generations server-side
  const rawGenerations = await prisma.generation.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      subject: true,
      grade: true,
      topic: true,
      examFormat: true,
      questionCount: true,
      questionTypes: true,
      feedback: true,
      createdAt: true,
      resultJson: true,
    },
  })

  // Only show successful generations; strip heavy resultJson from list payload
  const generations = rawGenerations
    .filter((g) => g.resultJson !== null)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ resultJson: _dropped, ...rest }) => rest)

  // All successful generations for filter dropdown options
  const all = await prisma.generation.findMany({
    where: { featureType: 'quiz' },
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
