import { z } from "zod";

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const CURRENT_YEAR = new Date().getFullYear();

export const birthdayInputSchema = z
  .object({
    discordUserId: z.string().min(1, "Elegí un miembro"),
    displayName: z.string().trim().min(1).max(100),
    day: z.number().int().min(1).max(31),
    month: z.number().int().min(1).max(12),
    year: z
      .number()
      .int()
      .min(1900)
      .max(CURRENT_YEAR)
      .nullable()
      .optional()
      .transform((v) => v ?? null),
    channelId: z
      .string()
      .nullable()
      .optional()
      .transform((v) => (v ? v : null)),
    customMessage: z
      .string()
      .max(500)
      .nullable()
      .optional()
      .transform((v) => (v ? v : null)),
    imageUrl: z
      .union([z.string().trim().url("La URL de la imagen no es válida").max(500), z.literal("")])
      .nullable()
      .optional()
      .transform((v) => (v ? v : null)),
    color: z
      .number()
      .int()
      .min(0)
      .max(0xffffff)
      .nullable()
      .optional()
      .transform((v) => v ?? null),
    isActive: z.boolean().default(true),
  })
  .refine((data) => data.day <= DAYS_IN_MONTH[data.month - 1], {
    message: "Ese día no existe para el mes elegido",
    path: ["day"],
  });

export type BirthdayInput = z.infer<typeof birthdayInputSchema>;
