import {
  BroadcastValidationError,
  EmbedNotFoundError,
  EmbedValidationError,
  broadcastInputSchema,
  createBroadcast,
} from "@hubbert/modules";
import { translateDiscordError } from "@hubbert/discord";
import { getGuildAccess } from "@/lib/guild-access";
import { apiError, apiSuccess, guildAccessErrorResponse } from "@/lib/api-response";

export async function POST(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const access = await getGuildAccess(guildId);
  if (!access.ok) return guildAccessErrorResponse(access.reason);

  const json = await request.json().catch(() => null);
  const parsed = broadcastInputSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Datos inválidos.", 400);
  }

  try {
    const broadcast = await createBroadcast(guildId, access.userId, parsed.data);
    return apiSuccess({ id: broadcast.id, total: broadcast.total }, 201);
  } catch (err) {
    if (err instanceof EmbedNotFoundError) return apiError("NOT_FOUND", "Embed no encontrado.", 404);
    if (err instanceof EmbedValidationError || err instanceof BroadcastValidationError) {
      return apiError("VALIDATION_ERROR", err.message, 400);
    }
    return apiError("DISCORD_API_ERROR", translateDiscordError(err), 502);
  }
}
