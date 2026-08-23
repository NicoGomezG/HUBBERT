import { z } from "zod";

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export const REPEAT_MODES = ["daily", "once"] as const;

export const reminderInputSchema = z.object({
  title: z.string().trim().min(1, "Poné un título").max(100),
  description: z
    .string()
    .max(500)
    .nullable()
    .optional()
    .transform((v) => (v ? v : null)),
  targetDate: z
    .string()
    .regex(DATE_RE, "Fecha inválida")
    .transform((v) => {
      const match = v.match(DATE_RE)!;
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      return new Date(Date.UTC(year, month - 1, day));
    }),
  channelId: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v ? v : null)),
  daysBefore: z.number().int().min(0, "Mínimo 0 días").max(365, "Máximo 365 días"),
  repeatMode: z.enum(REPEAT_MODES).default("daily"),
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
});

export type ReminderInput = z.infer<typeof reminderInputSchema>;
