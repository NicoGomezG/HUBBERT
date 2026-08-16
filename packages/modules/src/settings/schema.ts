import { z } from "zod";

export const guildSettingsInputSchema = z.object({
  timezone: z.string().min(1, "Elegí una zona horaria"),
  defaultChannelId: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v ? v : null)),
});

export type GuildSettingsInput = z.infer<typeof guildSettingsInputSchema>;
