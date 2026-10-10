import { z } from "zod";
import { EMBED_LIMITS } from "@hubbert/discord";

export const optionalUrl = z
  .union([z.literal(""), z.url()])
  .optional()
  .nullable()
  .transform((v) => (v ? v : null));

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

// Reglas de Discord para el nombre de un webhook: 1-80 caracteres y sin
// "discord", "clyde", "everyone" ni "here".
export const senderNameSchema = optionalText(80).refine(
  (v) => !v || !/discord|clyde|^(everyone|here)$/i.test(v.trim()),
  'El nombre no puede contener "discord" ni "clyde", ni ser "everyone" o "here".'
);

export const embedFieldSchema = z.object({
  name: z.string().trim().min(1, "El nombre del field no puede estar vacío").max(EMBED_LIMITS.fieldName),
  value: z.string().trim().min(1, "El valor del field no puede estar vacío").max(EMBED_LIMITS.fieldValue),
  inline: z.boolean().default(false),
});

export const embedInputSchema = z.object({
  name: z.string().trim().min(1, "El embed necesita un nombre interno").max(100),
  title: optionalText(EMBED_LIMITS.title),
  description: optionalText(EMBED_LIMITS.description),
  url: optionalUrl,
  color: z.number().int().min(0).max(0xffffff).optional().nullable(),
  authorName: optionalText(EMBED_LIMITS.authorName),
  authorUrl: optionalUrl,
  authorIconUrl: optionalUrl,
  imageUrl: optionalUrl,
  thumbnailUrl: optionalUrl,
  footerText: optionalText(EMBED_LIMITS.footerText),
  footerIconUrl: optionalUrl,
  showTimestamp: z.boolean().default(false),
  fields: z.array(embedFieldSchema).max(EMBED_LIMITS.maxFields).default([]),
  senderName: senderNameSchema,
  senderAvatarUrl: optionalUrl,
});

export type EmbedInputPayload = z.infer<typeof embedInputSchema>;

export const sendEmbedSchema = z.object({
  channelId: z.string().min(1, "Elegí un canal"),
});
