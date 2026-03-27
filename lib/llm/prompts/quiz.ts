export interface QuizPromptParams {
  subject: string
  grade: number
  topic: string
  examFormat?: string | null
  questionTypes: string[]
  questionCount: number
  /** When multiple types selected: per-type counts (overrides questionCount) */
  questionCountPerType?: Record<string, number>
  textbookName?: string | null
  extraInstructions?: string | null
}

const EXAM_FORMAT_MAP: Record<string, string> = {
  ФГОС: 'По требованиям ФГОС',
  ОГЭ: 'В формате ОГЭ: задания части 1 (краткий ответ) и части 2 (развёрнутый ответ)',
  ЕГЭ: 'В формате ЕГЭ: задания базового и повышенного уровня',
  ВПР: 'В формате ВПР',
}

const JSON_SCHEMA = `{
  "title": string,
  "subject": string,
  "grade": number,
  "topic": string,
  "format": string,
  "questions": [
    {
      "number": number,
      "type": "single_choice" | "multiple_choice" | "true_false" | "short_answer",
      "text": string,
      "options": string[], // только для single_choice и multiple_choice
      "answer": string | string[], // массив для multiple_choice
      "explanation": string
    }
  ]
}`

const INVALID_TOPIC_SCHEMA = `{
  "error": "topic_invalid",
  "message": string  // одно предложение, почему тема не подходит
}`

export const QUIZ_SYSTEM_PROMPT = `Ты — методист-эксперт по российским школьным программам. Создаёшь качественные тесты и проверочные работы строго на русском языке.

ВАЖНО — перед генерацией теста обязательно проверь запрос:
1. Предмет должен входить в учебный план российской общеобразовательной школы (математика, русский язык, литература, история, география, биология, химия, физика, информатика, обществознание, английский язык, ИЗО, музыка, технология, физкультура, ОБЖ и т.п.).
2. Тема должна реально изучаться в рамках этого предмета для указанного класса по российской программе.
3. Тема не должна быть выдуманной, фантастической, абсурдной, оскорбительной или не связанной с реальной школьной программой.

Если хотя бы одно условие нарушено — НЕ генерируй тест. Верни JSON вида:
${INVALID_TOPIC_SCHEMA}

Если тема корректна — верни тест в JSON-формате без markdown-обёртки и без пояснений вне JSON.`

const TYPE_LABELS_RU: Record<string, string> = {
  single_choice: 'С выбором одного ответа',
  multiple_choice: 'С выбором нескольких ответов',
  true_false: 'Верно / Неверно',
  short_answer: 'Краткий ответ',
}

export function buildQuizPrompt(params: QuizPromptParams): string {
  const {
    subject,
    grade,
    topic,
    examFormat,
    questionTypes,
    questionCount,
    questionCountPerType,
    textbookName,
    extraInstructions,
  } = params

  const formatLabel = examFormat
    ? (EXAM_FORMAT_MAP[examFormat] ?? 'Без привязки к стандарту')
    : 'Без привязки к стандарту'

  const isMultiType = questionTypes.length > 1 && questionCountPerType

  const lines: string[] = [
    `Создай тест по предмету: ${subject}`,
    `Класс: ${grade}`,
    `Тема: ${topic}`,
    `Стандарт: ${formatLabel}`,
  ]

  if (isMultiType) {
    const total = questionTypes.reduce((s, t) => s + (questionCountPerType![t] ?? 0), 0)
    lines.push('Типы вопросов и количество каждого:')
    for (const t of questionTypes) {
      const cnt = questionCountPerType![t] ?? 0
      lines.push(`  - ${TYPE_LABELS_RU[t] ?? t}: ${cnt} вопр.`)
    }
    lines.push(`Итого: ${total} вопросов`)
  } else {
    lines.push(`Типы вопросов: ${questionTypes.join(', ')}`)
    lines.push(`Количество вопросов: ${questionCount}`)
  }

  if (textbookName) {
    lines.push(`Ориентируйся на материал учебника: ${textbookName}`)
  }

  if (extraInstructions) {
    lines.push(`Дополнительные требования учителя: ${extraInstructions}`)
  }

  lines.push('')
  lines.push('Верни ответ строго в следующем JSON-формате:')
  lines.push(JSON_SCHEMA)

  return lines.join('\n')
}
