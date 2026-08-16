import { PrismaClient } from "@prisma/client";

// Evita crear un PrismaClient nuevo en cada hot-reload de dev / cada
// invocación fría de una función serverless que reutiliza el mismo
// contenedor.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
