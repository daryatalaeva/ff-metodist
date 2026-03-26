import { NextRequest } from 'next/server'
import { getLLMClient } from '@/lib/llm'
import { buildQuizPrompt, QUIZ_SYSTEM_PROMPT } from '@/lib/llm/prompts/quiz'
import { extractJson } from '@/lib/llm/parseJson'
import { prisma } from '@/lib/db/prisma'

interface GenerateBody {
  subject?: unknown
  grade?: unknown
  topic?: unknown
  questionTypes?: unknown
  questionCount?: unknown
  examFormat?: unknown
  textbookName?: unknown
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
  if (!Array.isArray(body.questionTypes) || body.questionTypes.length === 0) {
    errors.push({ field: 'questionTypes', message: 'questionTypes must be a non-empty array' })
  }
  if (
    body.questionCount === undefined ||
    body.questionCount === null ||
    typeof body.questionCount !== 'number' ||
    !Number.isInteger(body.questionCount) ||
    (body.questionCount as number) < 1
  ) {
    errors.push({ field: 'questionCount', message: 'questionCount must be a positive integer' })
  }

  return errors
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

  const subject = (body.subject as string).trim()
  const grade = body.grade as number
  const topic = (body.topic as string).trim()
  const questionTypes = body.questionTypes as string[]
  const questionCount = body.questionCount as number
  const examFormat = typeof body.examFormat === 'string' ? body.examFormat : null
  const textbookName = typeof body.textbookName === 'string' ? body.textbookName.trim() || null : null
  const extraInstructions = typeof body.extraInstructions === 'string' ? body.extraInstructions.trim() || null : null
  const userId = typeof body.userId === 'string' ? body.userId : null

  // Create generation record upfront
  const generation = await prisma.generation.create({
    data: {
      userId,
      featureType: 'quiz',
      subject,
      grade,
      topic,
      examFormat,
      questionTypes,
      questionCount,
      textbookName,
      extraInstructions,
    },
  })

  const prompt = buildQuizPrompt({ subject, grade, topic, examFormat, questionTypes, questionCount, textbookName, extraInstructions })
  const llm = getLLMClient()

  const encoder = new TextEncoder()
  let resultText = ''

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const llmStream = await llm.generate(prompt, QUIZ_SYSTEM_PROMPT)
        const reader = llmStream.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          resultText += chunk

          // SSE format
          const sseChunk = `data: ${JSON.stringify({ text: chunk })}\n\n`
          controller.enqueue(encoder.encode(sseChunk))
        }

        // Log raw response so we can inspect what the LLM actually returned
        console.log('[generate] raw LLM response (%d chars):\n%s', resultText.length, resultText.slice(0, 1000))

        // Persist result — extract JSON even if wrapped in markdown fences
        let resultJson: unknown = null
        try {
          resultJson = extractJson(resultText)
        } catch (parseErr) {
          console.error('[generate] JSON extraction failed:', parseErr)
        }

        await prisma.generation.update({
          where: { id: generation.id },
          data: {
            resultText,
            resultJson: resultJson ?? undefined,
          },
        })

        // Send generation id so the client can use it for feedback/tracking
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
