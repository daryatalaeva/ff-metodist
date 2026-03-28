export interface LessonPlanPromptParams {
  subject: string
  grade: number
  topic: string
  lessonType: 'new_knowledge' | 'reflection' | 'methodology' | 'developmental_control' | 'combined'
  lessonForm?: 'traditional' | 'practical' | 'seminar' | 'game' | 'project' | 'lecture' | 'excursion' | 'test_lesson'
  lessonDuration: 40 | 45 | 90
  lessonPosition?: 'intro' | 'main' | 'final'
  examFormat?: string | null
  textbookName?: string | null
  extraInstructions?: string | null
  hasFile?: boolean
}

const LESSON_TYPE_MAP: Record<string, string> = {
  new_knowledge:        'Урок открытия нового знания',
  reflection:           'Урок рефлексии (отработка умений и коррекция)',
  methodology:          'Урок общеметодологической направленности (систематизация и обобщение)',
  developmental_control:'Урок развивающего контроля',
  combined:             'Комбинированный урок',
}

const LESSON_FORM_MAP: Record<string, string> = {
  traditional: 'Традиционный',
  practical:   'Практикум',
  seminar:     'Семинар / дискуссия',
  game:        'Ролевая игра / викторина',
  project:     'Защита проектов',
  lecture:     'Лекция',
  excursion:   'Экскурсия / выездное занятие',
  test_lesson: 'Урок-зачёт',
}

const LESSON_POSITION_MAP: Record<string, string> = {
  intro: 'Вводный урок (первый урок по теме)',
  main:  'Основной урок (в середине темы)',
  final: 'Итоговый урок (завершает изучение темы)',
}

const EXAM_FORMAT_MAP: Record<string, string> = {
  ФГОС:          'По требованиям ФГОС',
  ОГЭ:           'С учётом подготовки к ОГЭ',
  ЕГЭ:           'С учётом подготовки к ЕГЭ',
  'Без привязки':'Без привязки к стандарту',
}

const STAGE_REQUIREMENTS: Record<string, string> = {
  new_knowledge:        'мотивация → актуализация → постановка задачи → открытие нового знания → первичное закрепление → самостоятельная работа → рефлексия',
  reflection:           'актуализация → выявление затруднений → коррекция → самостоятельная работа по эталону → рефлексия',
  developmental_control:'мотивация → контрольная работа → самопроверка/взаимопроверка → рефлексия',
  combined:             'проверка д/з → актуализация → изучение нового → закрепление → рефлексия',
  methodology:          'систематизация понятий → построение обобщённых норм → рефлексия',
}

const JSON_SCHEMA = `{
  "title": "Тема урока",
  "subject": "Предмет",
  "grade": число,
  "lesson_type": "Тип урока",
  "lesson_form": "Форма проведения",
  "duration_minutes": число,
  "goals": {
    "educational": "Обучающая цель",
    "developmental": "Развивающая цель",
    "upbringing": "Воспитательная цель"
  },
  "planned_results": {
    "subject": "Предметные результаты",
    "meta_subject": "Метапредметные результаты (УУД)",
    "personal": "Личностные результаты"
  },
  "equipment": ["Список оборудования и материалов"],
  "stages": [
    {
      "number": 1,
      "name": "Название этапа",
      "duration_minutes": число,
      "teacher_activity": "Что делает учитель (конкретно)",
      "student_activity": "Что делают ученики (конкретно)",
      "methods_and_forms": "Конкретные приёмы: фронтальная беседа, работа в парах и т.д.",
      "notes": "Дополнительно (опционально, можно опустить)"
    }
  ],
  "homework": "Домашнее задание (если уместно)",
  "self_analysis_questions": ["Вопрос для самоанализа урока"]
}`

export const LESSON_PLAN_SYSTEM_PROMPT = `Ты — опытный методист российской школы.
Составляешь поурочные планы строго на русском языке в соответствии с требованиями ФГОС.
Учитываешь тип урока, форму проведения, возраст учеников и предметную специфику.
Возвращаешь результат строго в формате JSON без markdown-обёртки и без пояснений вне JSON.
Структура урока должна реалистично укладываться в указанное время.`

export function buildLessonPlanPrompt(params: LessonPlanPromptParams): { systemPrompt: string; userPrompt: string } {
  const {
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
    hasFile,
  } = params

  const lessonTypeDesc    = LESSON_TYPE_MAP[lessonType]
  const lessonFormDesc    = lessonForm ? LESSON_FORM_MAP[lessonForm] : null
  const lessonPositionDesc= lessonPosition ? LESSON_POSITION_MAP[lessonPosition] : null
  const examFormatDesc    = examFormat
    ? (EXAM_FORMAT_MAP[examFormat] ?? 'Без привязки к стандарту')
    : 'Без привязки к стандарту'
  const stageRequirements = STAGE_REQUIREMENTS[lessonType]

  const lines: string[] = []

  if (hasFile) {
    lines.push('Составляй план строго на основе предоставленного текста учебника.')
    lines.push('')
  }

  lines.push(`Составь поурочный план для ${grade} класса по предмету «${subject}» на тему «${topic}».`)
  lines.push('')
  lines.push(`Тип урока по ФГОС: ${lessonTypeDesc}`)

  if (lessonFormDesc) {
    lines.push(`Форма проведения: ${lessonFormDesc}`)
  }

  lines.push(`Продолжительность: ${lessonDuration} минут`)

  if (lessonPositionDesc) {
    lines.push(`Место в теме: ${lessonPositionDesc}`)
  }

  lines.push(`Образовательный стандарт: ${examFormatDesc}`)

  if (textbookName) {
    lines.push(`Ориентируйся на учебник: ${textbookName}`)
  }

  if (extraInstructions) {
    lines.push(`Дополнительные требования учителя: ${extraInstructions}`)
  }

  lines.push('')
  lines.push(`Верни результат в JSON следующей схемы:`)
  lines.push(JSON_SCHEMA)
  lines.push('')
  lines.push('Требования к этапам:')
  lines.push(`- Сумма duration_minutes всех этапов РАВНА ${lessonDuration}`)
  lines.push(`- Последовательность для данного типа урока: ${stageRequirements}`)

  return {
    systemPrompt: LESSON_PLAN_SYSTEM_PROMPT,
    userPrompt: lines.join('\n'),
  }
}
