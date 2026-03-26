/**
 * Extracts a JSON object from an LLM response that may contain:
 * - markdown code fences (```json ... ``` or ``` ... ```)
 * - leading/trailing prose around the JSON
 */
export function extractJson(text: string): unknown {
  const raw = text.trim()

  // 1. Direct parse — happy path (Anthropic, clean responses)
  try {
    return JSON.parse(raw)
  } catch {}

  // 2. Strip markdown code fence: ```json\n...\n``` or ```\n...\n```
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim())
    } catch {}
  }

  // 3. Find the first top-level {...} block (handles leading/trailing prose)
  const braceStart = raw.indexOf('{')
  const braceEnd = raw.lastIndexOf('}')
  if (braceStart !== -1 && braceEnd > braceStart) {
    try {
      return JSON.parse(raw.slice(braceStart, braceEnd + 1))
    } catch {}
  }

  throw new Error(`Could not extract valid JSON from LLM response.\n\nRaw (first 500 chars):\n${raw.slice(0, 500)}`)
}
