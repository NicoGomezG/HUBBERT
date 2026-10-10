import { z } from "zod";
import { optionalUrl, senderNameSchema } from "../embeds/schema";

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v ? v : null));

export const welcomeSettingsInputSchema = z
  .object({
    welcomeEnabled: z.boolean(),
    welcomeChannelId: z
      .string()
      .nullable()
      .optional()
      .transform((v) => (v ? v : null)),
    welcomeTitle: optionalText(256),
    welcomeMessage: z.string().trim().min(1, "El mensaje de bienvenida no puede estar vacío").max(4000),
    welcomeColor: z
      .number()
      .int()
      .min(0)
      .max(0xffffff)
      .nullable()
      .optional()
      .transform((v) => v ?? null),
    welcomeImageUrl: optionalUrl,
    showAvatar: z.boolean().default(true),
    pingMember: z.boolean().default(true),
    senderName: senderNameSchema,
    senderAvatarUrl: optionalUrl,
    goodbyeEnabled: z.boolean(),
    // Corto a propósito: va junto al bloque fijo de Hubbert y un embed tiene 6000 caracteres en total.
    goodbyeMessage: z.string().trim().min(1, "El mensaje de despedida no puede estar vacío").max(1500),
  })
  .refine((v) => !v.welcomeEnabled || v.welcomeChannelId, {
    message: "Elige el canal donde publicar la bienvenida",
    path: ["welcomeChannelId"],
  });

export type WelcomeSettingsInput = z.infer<typeof welcomeSettingsInputSchema>;

export const welcomeTestSchema = z.object({ kind: z.enum(["welcome", "goodbye"]) });
