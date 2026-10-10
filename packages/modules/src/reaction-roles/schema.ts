import { z } from "zod";
import { parseEmoji } from "@hubbert/discord";
import { optionalUrl, senderNameSchema } from "../embeds/schema";
import { REACTION_ROLE_MAX_OPTIONS } from "./constants";

// Límites reales de Discord para title/description de un embed.
const EMBED_TITLE_MAX = 256;
const EMBED_DESCRIPTION_MAX = 4096;

const optionSchema = z.object({
  emoji: z.string().transform((value, ctx) => {
    const parsed = parseEmoji(value);
    if (!parsed) {
      ctx.addIssue({ code: "custom", message: `"${value}" no es un emoji válido.` });
      return z.NEVER;
    }
    return parsed;
  }),
  roleId: z.string().min(1, "Elige un rol para cada emoji"),
  label: z
    .string()
    .trim()
    .max(100)
    .nullable()
    .optional()
    .transform((v) => (v ? v : null)),
});

export const reactionRolePanelInputSchema = z
  .object({
    title: z.string().trim().min(1).max(EMBED_TITLE_MAX),
    description: z
      .string()
      .max(EMBED_DESCRIPTION_MAX)
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
    imageUrl: optionalUrl,
    senderName: senderNameSchema,
    senderAvatarUrl: optionalUrl,
    mode: z.enum(["multiple", "single"]).default("multiple"),
    channelId: z.string().min(1, "Elige un canal"),
    options: z
      .array(optionSchema)
      .min(1, "Agrega al menos un emoji con su rol")
      .max(REACTION_ROLE_MAX_OPTIONS, `Discord permite máximo ${REACTION_ROLE_MAX_OPTIONS} reacciones por mensaje`),
  })
  .superRefine((input, ctx) => {
    const emojis = new Set<string>();
    const roles = new Set<string>();
    for (const option of input.options) {
      if (emojis.has(option.emoji.key)) {
        ctx.addIssue({ code: "custom", message: `El emoji ${option.emoji.display} está repetido.` });
      }
      if (roles.has(option.roleId)) {
        ctx.addIssue({ code: "custom", message: "Hay un rol repetido en dos emojis distintos." });
      }
      emojis.add(option.emoji.key);
      roles.add(option.roleId);
    }
  });

export type ReactionRolePanelInput = z.infer<typeof reactionRolePanelInputSchema>;
