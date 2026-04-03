export interface QuizPromptParams {
  subject: string
  grade: number
  topic: string
  questionTypes: string[]
  questionCount: number
  /** When multiple types selected: per-type counts (overrides questionCount) */
  questionCountPerType?: Record<string, number>
  textbookName?: string | null
  extraInstructions?: string | null
}

const JSON_SCHEMA = `{
  "title": string,
  "subject": string,
  "grade": number,
  "topic": string,
  "questions": [
    {
      "number": number,
      "type": "single_choice" | "multiple_choice" | "true_false" | "short_answer",
      "text": string,
      "options": string[], // только для single_choice и multiple_choice
      "answer": string | string[], // массив для multiple_choice
      "explanation": string,
      "image_hint": string // 2–4 слова на английском для Unsplash, или "" если не применимо
    }
  ]
}`

export const QUIZ_SYSTEM_PROMPT = `Ты — методист-эксперт по российским школьным программам.
Создаёшь тесты и проверочные работы строго на русском языке
в соответствии с ФГОС.

Правила генерации — соблюдай все без исключения:

СКОУП ТЕМЫ. Каждый вопрос проверяет знания строго в рамках
указанной темы. Если тема — «Правление Николая II», вопрос про
Александра III или революцию 1917 года недопустим. Не расширяй
тему до эпохи, периода или смежных понятий.

СООТВЕТСТВИЕ КЛАССУ. Адаптируй сложность, словарный запас
и тип мышления под указанный класс:
- 1–4 класс: простые формулировки, один факт в вопросе, варианты
  ответа короткие и очевидно различимые.
- 5–7 класс: понятные формулировки, проверяем знание фактов
  и базовых понятий, варианты ответа без ловушек.
- 8–9 класс: допустимы вопросы на сравнение, причинно-следственные
  связи, применение понятий. Варианты ответа могут быть схожими.
- 10–11 класс: аналитические вопросы, оценка явлений, работа
  с определениями. Допустимы задания повышенной сложности.

УЧЕБНИК. Если указано название учебника — вопросы опираются
на его терминологию, логику подачи материала и факты. Не вводи
термины и факты, которых заведомо нет в этом учебнике.

ТРЕБОВАНИЯ УЧИТЕЛЯ. Если указаны дополнительные требования —
выполняй их в приоритете над своими умолчаниями.

IMAGE_HINT. Для каждого вопроса заполняй поле image_hint —
короткая фраза на английском (2–4 слова) для поиска иллюстрации на Unsplash.
Заполнять ТОЛЬКО если вопрос про визуально наглядный объект:
исторический деятель или событие, географический объект, живое существо,
произведение искусства.
Для математики, грамматики, абстрактных понятий — оставлять пустой строкой "".

ФОРМУЛЫ. Все математические выражения, уравнения и формулы
записывай в формате LaTeX, обёрнутом в знаки доллара.
Инлайн: $x^2 + 2x + 1$
Блок: $$x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$$
Не используй обычный текст для формул: не x^2, а $x^2$.

Возвращай результат строго в формате JSON без markdown-обёртки
и без пояснений вне JSON.`

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
    questionTypes,
    questionCount,
    questionCountPerType,
    textbookName,
    extraInstructions,
  } = params

  const isMultiType = questionTypes.length > 1 && questionCountPerType

  let questionTypesDescription: string
  let questionCountLine: string
  if (isMultiType) {
    const total = questionTypes.reduce((s, t) => s + (questionCountPerType![t] ?? 0), 0)
    const perType = questionTypes
      .map((t) => `  - ${TYPE_LABELS_RU[t] ?? t}: ${questionCountPerType![t] ?? 0} вопр.`)
      .join('\n')
    questionTypesDescription = perType
    questionCountLine = `Итого: ${total} вопросов`
  } else {
    questionTypesDescription = questionTypes.map((t) => TYPE_LABELS_RU[t] ?? t).join(', ')
    questionCountLine = String(questionCount)
  }

  const textbookBlock = textbookName
    ? `Учебник: ${textbookName}\nВопросы должны опираться на терминологию, факты и логику подачи материала именно этого учебника.`
    : ''

  const extraInstructionsBlock = extraInstructions
    ? `Требования учителя (выполнить в первую очередь): ${extraInstructions}`
    : ''

  const parts = [
    `Создай проверочную работу.`,
    ``,
    `Предмет: ${subject}`,
    `Класс: ${grade}`,
    `Тема: «${topic}»`,
    ``,
    `ВАЖНО: генерируй вопросы ТОЛЬКО по теме «${topic}». Не выходи`,
    `за её рамки, даже если тема входит в более широкий раздел или период.`,
    ``,
    `Типы вопросов: ${questionTypesDescription}`,
    `Количество вопросов: ${questionCountLine}`,
  ]

  if (textbookBlock) {
    parts.push(``, textbookBlock)
  }

  if (extraInstructionsBlock) {
    parts.push(``, extraInstructionsBlock)
  }

  parts.push(``, `Верни ответ строго в следующем JSON-формате:`, JSON_SCHEMA)

  return parts.join('\n')
}
