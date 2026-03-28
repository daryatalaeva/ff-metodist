import { prisma } from '@/lib/db/prisma'

const DEFAULT_LIMIT = 20

export interface LimitCheckResult {
  allowed: boolean
  used: number
  limit: number
}

/**
 * Checks whether a user has remaining free generations.
 *
 * - If userId is provided: counts all DB generations for that user.
 * - If userId is null: skips the server-side check (client-side localStorage
 *   is the fallback; server enforcement requires auth).
 *
 * The limit can be overridden in the `Setting` table via key `max_free_generations`.
 */
export async function checkGenerationLimit(userId: string | null): Promise<LimitCheckResult> {
  if (!userId) {
    return { allowed: true, used: 0, limit: DEFAULT_LIMIT }
  }

  const [setting, used] = await Promise.all([
    prisma.setting.findUnique({ where: { key: 'max_free_generations' } }),
    prisma.generation.count({ where: { userId } }),
  ])

  const limit = setting ? parseInt(setting.value, 10) : DEFAULT_LIMIT

  return { allowed: used < limit, used, limit }
}
