import { PrismaClient } from "@prisma/client";

// Reuse a single PrismaClient instance across module reloads (important in
// dev with tsx watch) so we don't exhaust the Postgres connection pool.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
