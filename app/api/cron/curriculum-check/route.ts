import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'

const FOP_URL = 'https://static.edsoo.ru/projects/fop/index.html'
const SETTING_KEY = 'fop_bundle_hash'

/**
 * Vercel Cron — запускается 1-го числа каждого месяца в 09:00 UTC.
 * Проверяет, изменился ли JS-бандл сайта ФОП (edsoo.ru).
 * Если хэш изменился — предметный список subjects.ts нужно актуализировать.
 *
 * Vercel автоматически передаёт заголовок Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(req: NextRequest) {
  // ── Авторизация ───────────────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  // ── Получаем страницу ─────────────────────────────────────────────────────
  let html: string
  try {
    const res = await fetch(FOP_URL, { cache: 'no-store' })
    if (!res.ok) {
      console.error('[cron/curriculum-check] fetch failed:', res.status)
      return Response.json({ error: `fetch failed: ${res.status}` }, { status: 502 })
    }
    html = await res.text()
  } catch (err) {
    console.error('[cron/curriculum-check] network error:', err)
    return Response.json({ error: 'network error' }, { status: 502 })
  }

  // ── Извлекаем имя JS-бандла (содержит content-hash) ──────────────────────
  const match = html.match(/\/static\/js\/(main\.[a-f0-9]+\.js)/)
  const currentBundle = match?.[1] ?? null

  // ── Сравниваем с сохранённым значением ────────────────────────────────────
  const stored = await prisma.setting.findUnique({ where: { key: SETTING_KEY } })

  if (!stored) {
    await prisma.setting.create({ data: { key: SETTING_KEY, value: currentBundle ?? '' } })
    console.log('[cron/curriculum-check] initialized. bundle:', currentBundle)
    return Response.json({ status: 'initialized', bundle: currentBundle })
  }

  if (stored.value !== currentBundle) {
    await prisma.setting.update({
      where: { key: SETTING_KEY },
      data: { value: currentBundle ?? '' },
    })
    const msg =
      `[cron/curriculum-check] ⚠️  BUNDLE CHANGED: ${stored.value} → ${currentBundle}. ` +
      `Проверь lib/curriculum/subjects.ts на актуальность.`
    console.warn(msg)
    return Response.json({
      status: 'changed',
      previous: stored.value,
      current: currentBundle,
      action: 'Review lib/curriculum/subjects.ts for curriculum updates',
    })
  }

  console.log('[cron/curriculum-check] no changes. bundle:', currentBundle)
  return Response.json({ status: 'unchanged', bundle: currentBundle })
}
