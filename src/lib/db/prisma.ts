import { PrismaClient } from "@prisma/client";

declare global {
  var __monstraPrisma: PrismaClient | undefined;
}

export const prisma =
  global.__monstraPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__monstraPrisma = prisma;
}
