import { findSubject } from './subjects'
import { getLLMClient } from '../llm'

const VALIDATION_SYSTEM =
  'Ты — валидатор учебных тем для российской общеобразовательной школы.\n\n' +
  'Отклоняй тему, если она:\n' +
  '- содержит несуществующие, выдуманные или фантастические понятия\n' +
  '- не имеет отношения к указанному предмету\n' +
  '- явно не может изучаться в российской школе (например: инопланетяне, магия, несуществующие науки)\n' +
  '- содержит политически чувствительный контент, пропаганду, идеологически неприемлемые для российского образования темы\n\n' +
  'Принимай тему, если она:\n' +
  '- реальная концепция или явление, даже если формулировка немного отличается от стандартной\n' +
  '- по смыслу относится к указанному предмету для данного класса\n' +
  '- могла бы разумно входить в школьную программу РФ\n\n' +
  'Отвечай строго: «ДА» или «НЕТ: <причина одним предложением на русском>».'

export type ValidationResult =
  | { valid: true }
  | { valid: false; reason: string }

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
): Promise<ValidationResult> {
  // ── 1. Проверка предмета ──────────────────────────────────────────────────
  const subjectInfo = findSubject(subject)
  if (!subjectInfo) {
    return {
      valid: false,
      reason: `Предмет «${subject}» не входит в учебный план российской общеобразовательной школы.`,
    }
  }

  // ── 2. Проверка темы через LLM ────────────────────────────────────────────
  const prompt =
    `Предмет: «${subjectInfo.canonical}», ${grade} класс.\n` +
    `Тема: «${topic}».\n\n` +
    `Является ли эта тема реальной и уместной для изучения в российской школе по данному предмету?`

  try {
    const llm = getLLMClient()
    const raw = (await llm.text(prompt, VALIDATION_SYSTEM)).trim()

    // Strip markdown bold/italic markers that Claude sometimes adds
    const response = raw.replace(/\*+/g, '').trim()

    console.log('[curriculum] validation raw response:', JSON.stringify(raw))

    const isNo =
      /^нет\b/i.test(response) ||
      /^no\b/i.test(response)

    if (isNo) {
      const reason = response
        .replace(/^нет[:\s]*/i, '')
        .replace(/^no[:\s]*/i, '')
        .trim()
      return {
        valid: false,
        reason:
          reason ||
          `Тема «${topic}» не соответствует школьной программе РФ по предмету «${subjectInfo.canonical}».`,
      }
    }

    // If not explicitly "нет" — allow through (fail-open for ambiguous responses)
    return { valid: true }
  } catch (err) {
    // Если сам вызов валидации упал — не блокируем генерацию
    console.error('[curriculum] validation LLM call failed, allowing through:', err)
    return { valid: true }
  }
}
