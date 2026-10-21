import { z } from "zod";

export const broadcastInputSchema = z.object({
  embedId: z.string().min(1, "Elige un embed"),
  roleIds: z.array(z.string().min(1)).min(1, "Elige al menos un rol").max(25),
});

export type BroadcastInput = z.infer<typeof broadcastInputSchema>;

export const broadcastTestSchema = z.object({
  embedId: z.string().min(1, "Elige un embed"),
});
