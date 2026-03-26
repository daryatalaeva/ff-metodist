import { PrismaClient } from '@prisma/client'
import { PrismaNeonHttp } from '@prisma/adapter-neon'

// Use HTTP transport — WebSocket (ws) native addons break when bundled by Next.js webpack.
// PrismaNeonHttp uses Neon's HTTP API which works correctly in all Next.js runtimes.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createClient(): PrismaClient {
  const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {
    arrayMode: false,
    fullResults: false,
  })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
