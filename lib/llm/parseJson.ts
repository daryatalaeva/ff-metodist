/**
 * Extracts a JSON object from an LLM response that may contain:
 * - markdown code fences (```json ... ``` or ``` ... ```)
 * - leading/trailing prose around the JSON
 * - unclosed braces/brackets (GigaChat sometimes truncates the last object)
 */
export function extractJson(text: string): unknown {
  const raw = text.trim()

  // 1. Direct parse — happy path (clean responses)
  try {
    return JSON.parse(raw)
  } catch {}

  // 2. Strip markdown code fence: ```json\n...\n``` or ```\n...\n```
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) {
    const inner = fenceMatch[1].trim()
    try {
      return JSON.parse(inner)
    } catch {
      // fence content exists but may be malformed — try repair below
      const repaired = repairJson(inner)
      if (repaired !== null) return repaired
    }
  }

  // 3. Find the first top-level {...} block (handles leading/trailing prose)
  const braceStart = raw.indexOf('{')
  const braceEnd = raw.lastIndexOf('}')
  if (braceStart !== -1 && braceEnd > braceStart) {
    const candidate = raw.slice(braceStart, braceEnd + 1)
    try {
      return JSON.parse(candidate)
    } catch {
      // candidate exists but may be malformed — try repair
      const repaired = repairJson(candidate)
      if (repaired !== null) return repaired
    }
  }

  // 4. Last resort: repair the whole raw string
  const repaired = repairJson(raw)
  if (repaired !== null) return repaired

  throw new Error(`Could not extract valid JSON from LLM response.\n\nRaw (first 500 chars):\n${raw.slice(0, 500)}`)
}

/**
 * Repairs common LLM JSON truncation errors by inserting missing closing
 * braces/brackets in the correct positions using a stack-based approach.
 *
 * Example: GigaChat sometimes omits the closing } of the last array element:
 *   { "questions": [ { "text": "..." ]  }
 *                                  ^ inserts } here
 */
function repairJson(text: string): unknown | null {
  try {
    const stack: string[] = []
    let result = ''
    let inString = false
    let escaped = false

    for (let i = 0; i < text.length; i++) {
      const char = text[i]

      if (escaped) {
        result += char
        escaped = false
        continue
      }

      if (char === '\\' && inString) {
        result += char
        escaped = true
        continue
      }

      if (char === '"') {
        inString = !inString
        result += char
        continue
      }

      if (inString) {
        result += char
        continue
      }

      if (char === '{') {
        stack.push('}')
        result += char
      } else if (char === '[') {
        stack.push(']')
        result += char
      } else if (char === '}' || char === ']') {
        // Close any inner open structures before this closer
        while (stack.length > 0 && stack[stack.length - 1] !== char) {
          result += stack.pop()
        }
        if (stack.length > 0) stack.pop()
        result += char
      } else {
        result += char
      }
    }

    // Close any remaining open structures
    while (stack.length > 0) {
      result += stack.pop()
    }

    return JSON.parse(result)
  } catch {
    return null
  }
}
