import { prisma } from '@/lib/db/prisma'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const generation = await prisma.generation.findUnique({
    where: { id: params.id },
    select: {
      id:            true,
      featureType:   true,
      subject:       true,
      grade:         true,
      topic:         true,
      examFormat:    true,
      questionCount: true,
      questionTypes: true,
      lessonType:    true,
      lessonForm:    true,
      lessonDuration:true,
      resultJson:    true,
      resultText:    true,
      feedback:      true,
      createdAt:     true,
    },
  })

  if (!generation) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  return Response.json({ generation })
}
