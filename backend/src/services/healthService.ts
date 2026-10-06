import { prisma } from "../db";

// Lightweight database round-trip used by the /health endpoint to prove the
// API can actually reach Postgres, not just that the process is alive.
export async function checkDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
