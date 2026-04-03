import { findSubject } from './subjects'
import { getLLMClient } from '../llm'

const VALIDATION_SYSTEM =
  'Ты — валидатор учебных тем для российской общеобразовательной школы.\n\n' +
  'Оценивай тему по двум критериям независимо.\n\n' +
  'КРИТЕРИЙ 1 — ДОПУСТИМОСТЬ. Тема недопустима, если она:\n' +
  '- содержит несуществующие, выдуманные или фантастические понятия\n' +
  '  (инопланетяне, магия, несуществующие науки, эзотерика)\n' +
  '- явно не относится к указанному предмету\n' +
  '- содержит псевдонауку или нетрадиционные учения\n' +
  '- содержит политически уязвимый контент, пропаганду или идеологически\n' +
  '  неприемлемые для российского образования темы\n\n' +
  'КРИТЕРИЙ 2 — СООТВЕТСТВИЕ КЛАССУ.\n\n' +
  'Для классов 5–11: критерий 2 НИКОГДА не даёт НЕТ.\n' +
  'Только ПРЕДУПРЕЖДЕНИЕ или ДА — ничего другого.\n\n' +
  'Для классов 1–4: НЕТ только если тема университетского уровня,\n' +
  'например интегралы во 2 классе или квантовая механика в 3 классе.\n' +
  'В остальных случаях — ПРЕДУПРЕЖДЕНИЕ.\n\n' +
  'Если есть любое сомнение — ПРЕДУПРЕЖДЕНИЕ.\n\n' +
  'ВАЖНО: отвечай строго на русском языке.\n\n' +
  'Отвечай строго в одном из трёх форматов без дополнительного текста:\n' +
  '«ДА» — тема допустима и соответствует классу.\n' +
  '«НЕТ: <причина одним предложением>» — тема недопустима (нарушен критерий 1).\n' +
  '«ПРЕДУПРЕЖДЕНИЕ: <причина одним предложением>» — тема допустима,\n' +
  '  но предположительно не соответствует классу (нарушен только критерий 2).'

export type ValidationResult = {
  valid: boolean
  reason?: string
  warning?: string
}

/**
 * Проверяет, что предмет и тема соответствуют российской школьной программе.
 *
 * 1. Предмет проверяется по хардкод-списку (мгновенно, без LLM).
 * 2. Тема проверяется отдельным быстрым (non-streaming) LLM-вызовом.
 *    При сбое LLM-вызова — пропускаем (fail-open), чтобы не блокировать
 *    корректные запросы из-за временных ошибок сети.
 */
export async function validateCurriculumTopic(
  subject: string,
  grade: number,
  topic: string,
  options?: { skipLLM?: boolean },
): Promise<ValidationResult> {
  // ── 1. Проверка предмета ──────────────────────────────────────────────────
  const subjectInfo = findSubject(subject)
  if (!subjectInfo) {
    return {
      valid: false,
      reason: `Предмет «${subject}» не входит в учебный план российской общеобразовательной школы.`,
    }
  }

  if (options?.skipLLM) {
    return { valid: true }
  }

  // ── 2. Проверка темы через LLM ────────────────────────────────────────────
  const prompt =
    `Предмет: «${subjectInfo.canonical}», ${grade} класс.\n` +
    `Тема: «${topic}».\n\n` +
    `Является ли эта тема реальной и уместной для изучения в российской школе по данному предмету?`

  try {
    const llm = getLLMClient()
    const raw = (await llm.text(prompt, VALIDATION_SYSTEM)).trim()

    console.log('[curriculum] validation raw response:', JSON.stringify(raw))

    const lower = raw.trim().toLowerCase()
    const isNo = lower.startsWith('нет') || lower.startsWith('no')

    // Если модель вернула НЕТ для 5–11 класса —
    // это может быть только критерий 2, принудительно меняем на ПРЕДУПРЕЖДЕНИЕ
    if (isNo && grade >= 5) {
      const reason = raw.split(':').slice(1).join(':').trim()
      return { valid: true, warning: reason }
    }

    // Для 1–4 класса НЕТ остаётся НЕТ
    // Дальше обычный парсинг
    let result: ValidationResult

    if (isNo) {
      result = { valid: false, reason: raw.split(':').slice(1).join(':').trim() }
    } else if (lower.startsWith('предупреждение') || lower.startsWith('warning')) {
      result = { valid: true, warning: raw.split(':').slice(1).join(':').trim() }
    } else {
      result = { valid: true }
    }

    return result
  } catch (err) {
    // Если сам вызов валидации упал — не блокируем генерацию
    console.error('[curriculum] validation LLM call failed, allowing through:', err)
    return { valid: true }
  }
}
