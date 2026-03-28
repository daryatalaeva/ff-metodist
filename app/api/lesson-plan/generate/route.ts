import { NextRequest } from 'next/server'
import { getLLMClient } from '@/lib/llm'
import { buildLessonPlanPrompt } from '@/lib/llm/prompts/lesson_plan'
import { extractJson } from '@/lib/llm/parseJson'
import { checkGenerationLimit } from '@/lib/generation/limit'
import { prisma } from '@/lib/db/prisma'

const VALID_LESSON_TYPES = ['new_knowledge', 'reflection', 'methodology', 'developmental_control', 'combined'] as const
const VALID_LESSON_FORMS = ['traditional', 'practical', 'seminar', 'game', 'project', 'lecture', 'excursion', 'test_lesson'] as const
const VALID_DURATIONS = [40, 45, 90] as const
const VALID_POSITIONS = ['intro', 'main', 'final'] as const

type LessonType = (typeof VALID_LESSON_TYPES)[number]
type LessonForm = (typeof VALID_LESSON_FORMS)[number]
type LessonDuration = (typeof VALID_DURATIONS)[number]
type LessonPosition = (typeof VALID_POSITIONS)[number]

interface GenerateBody {
  subject?: unknown
  grade?: unknown
  topic?: unknown
  lessonType?: unknown
  lessonForm?: unknown
  lessonDuration?: unknown
  lessonPosition?: unknown
  examFormat?: unknown
  textbookName?: unknown
  textbookFileUrl?: unknown
  extraInstructions?: unknown
  userId?: unknown
}

interface ValidationError {
  field: string
  message: string
}

function validate(body: GenerateBody): ValidationError[] {
  const errors: ValidationError[] = []

  if (!body.subject || typeof body.subject !== 'string' || !body.subject.trim()) {
    errors.push({ field: 'subject', message: 'subject is required' })
  }
  if (body.grade === undefined || body.grade === null || typeof body.grade !== 'number' || !Number.isInteger(body.grade)) {
    errors.push({ field: 'grade', message: 'grade must be an integer' })
  }
  if (!body.topic || typeof body.topic !== 'string' || !body.topic.trim()) {
    errors.push({ field: 'topic', message: 'topic is required' })
  }
  if (!body.lessonType || !VALID_LESSON_TYPES.includes(body.lessonType as LessonType)) {
    errors.push({ field: 'lessonType', message: `lessonType must be one of: ${VALID_LESSON_TYPES.join(', ')}` })
  }
  if (!body.lessonDuration || !VALID_DURATIONS.includes(body.lessonDuration as LessonDuration)) {
    errors.push({ field: 'lessonDuration', message: `lessonDuration must be one of: ${VALID_DURATIONS.join(', ')}` })
  }

  return errors
}

/** Infer MIME type from a URL's file extension. */
function mimeFromUrl(url: string): string {
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return 'application/pdf'
  if (ext === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  return 'application/octet-stream'
}

export async function POST(req: NextRequest) {
  let body: GenerateBody
  try {
    body = await req.json()
  } catch {
    return Response.json({ errors: [{ field: 'body', message: 'Invalid JSON' }] }, { status: 400 })
  }

  const errors = validate(body)
  if (errors.length > 0) {
    return Response.json({ errors }, { status: 422 })
  }

  const subject         = (body.subject as string).trim()
  const grade           = body.grade as number
  const topic           = (body.topic as string).trim()
  const lessonType      = body.lessonType as LessonType
  const lessonDuration  = body.lessonDuration as LessonDuration
  const lessonForm      = VALID_LESSON_FORMS.includes(body.lessonForm as LessonForm) ? (body.lessonForm as LessonForm) : undefined
  const lessonPosition  = VALID_POSITIONS.includes(body.lessonPosition as LessonPosition) ? (body.lessonPosition as LessonPosition) : undefined
  const examFormat      = typeof body.examFormat === 'string' ? body.examFormat : null
  const textbookName    = typeof body.textbookName === 'string' ? body.textbookName.trim() || null : null
  const textbookFileUrl = typeof body.textbookFileUrl === 'string' ? body.textbookFileUrl.trim() || null : null
  const extraInstructions = typeof body.extraInstructions === 'string'
    ? body.extraInstructions.trim().slice(0, 500) || null
    : null
  const userId = typeof body.userId === 'string' ? body.userId : null

  // ── Generation limit ─────────────────────────────────────────────────────
  const limitCheck = await checkGenerationLimit(userId)
  if (!limitCheck.allowed) {
    return Response.json(
      { error: 'generation_limit_exceeded', used: limitCheck.used, limit: limitCheck.limit },
      { status: 402 },
    )
  }

  const generation = await prisma.generation.create({
    data: {
      userId,
      featureType: 'lesson_plan',
      subject,
      grade,
      topic,
      examFormat,
      textbookName,
      textbookFileUrl,
      extraInstructions,
      questionTypes: [],
      lessonType,
      lessonForm: lessonForm ?? null,
      lessonDuration,
      lessonPosition: lessonPosition ?? null,
    },
  })

  const { systemPrompt, userPrompt } = buildLessonPlanPrompt({
    subject,
    grade,
    topic,
    lessonType,
    lessonForm,
    lessonDuration,
    lessonPosition,
    examFormat,
    textbookName,
    extraInstructions,
    hasFile: textbookFileUrl !== null,
  })

  const llm = getLLMClient()
  const encoder = new TextEncoder()
  let resultText = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // If a file URL is provided, pass the document directly to the LLM.
        const { stream: llmStream, usage } = textbookFileUrl
          ? await llm.generateWithFile(userPrompt, systemPrompt, textbookFileUrl, mimeFromUrl(textbookFileUrl))
          : await llm.generate(userPrompt, systemPrompt)

        const reader = llmStream.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          resultText += chunk

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`))
        }

        console.log('[lesson-plan/generate] raw LLM response (%d chars):\n%s', resultText.length, resultText.slice(0, 1000))

        let resultJson: unknown = null
        try {
          resultJson = extractJson(resultText)
        } catch (parseErr) {
          console.error('[lesson-plan/generate] JSON extraction failed:', parseErr)
        }

        const tokenUsage = await usage

        await prisma.generation.update({
          where: { id: generation.id },
          data: {
            resultText,
            resultJson: resultJson ?? undefined,
            promptTokens: tokenUsage?.promptTokens ?? undefined,
            completionTokens: tokenUsage?.completionTokens ?? undefined,
          },
        })

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, generationId: generation.id })}\n\n`))
        controller.close()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error'
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`))
        controller.close()

        await prisma.generation.delete({ where: { id: generation.id } }).catch(() => {})
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Generation-Id': generation.id,
    },
  })
}
