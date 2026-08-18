import { z } from "zod";

// Límites reales de Discord para title/description de un embed.
const EMBED_TITLE_MAX = 256;
const EMBED_DESCRIPTION_MAX = 4096;

export const ticketPanelInputSchema = z.object({
  title: z.string().trim().min(1).max(EMBED_TITLE_MAX),
  description: z
    .string()
    .max(EMBED_DESCRIPTION_MAX)
    .nullable()
    .optional()
    .transform((v) => (v ? v : null)),
  buttonLabel: z.string().trim().min(1).max(80).default("Abrir ticket"),
  channelId: z.string().min(1, "Elegí un canal"),
});

export type TicketPanelInput = z.infer<typeof ticketPanelInputSchema>;
