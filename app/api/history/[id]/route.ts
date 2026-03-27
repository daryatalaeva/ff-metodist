import { prisma } from '@/lib/db/prisma'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const generation = await prisma.generation.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      subject: true,
      grade: true,
      topic: true,
      examFormat: true,
      questionCount: true,
      questionTypes: true,
      resultJson: true,
      feedback: true,
      createdAt: true,
    },
  })

  if (!generation || !generation.resultJson) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  return Response.json({ generation })
}
