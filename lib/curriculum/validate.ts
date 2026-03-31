import { findSubject } from './subjects'
import { getLLMClient } from '../llm'

const VALIDATION_SYSTEM =
  'Ты — строгий валидатор учебных тем. ' +
  'Отвечай только «ДА» или «НЕТ: <причина одним предложением на русском языке>». ' +
  'Никаких других слов и объяснений.'

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
    `Является ли тема «${topic}» реальной учебной темой из действующей ` +
    `школьной программы РФ по предмету «${subjectInfo.canonical}» для ${grade} класса?\n\n` +
    `Тема должна реально изучаться в российских школах, а не быть выдуманной, ` +
    `фантастической, абсурдной или не относящейся к данному предмету.`

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

    const isYes =
      /^да\b/i.test(response) ||
      /^yes\b/i.test(response)

    if (!isYes) {
      // LLM responded with something unexpected — log and block to be safe
      console.warn('[curriculum] unexpected validation response, blocking:', JSON.stringify(raw))
      return {
        valid: false,
        reason: `Тема «${topic}» не соответствует школьной программе РФ по предмету «${subjectInfo.canonical}».`,
      }
    }

    return { valid: true }
  } catch (err) {
    // Если сам вызов валидации упал — не блокируем генерацию
    console.error('[curriculum] validation LLM call failed, allowing through:', err)
    return { valid: true }
  }
}
