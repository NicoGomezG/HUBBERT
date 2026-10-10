import { translateDiscordError } from "@hubbert/discord";
import {
  ReactionRolePanelNotFoundError,
  ReactionRoleValidationError,
  deleteReactionRolePanel,
  reactionRolePanelInputSchema,
  updateReactionRolePanel,
} from "@hubbert/modules";
import { getGuildAccess } from "@/lib/guild-access";
import { apiError, apiSuccess, guildAccessErrorResponse } from "@/lib/api-response";

type Params = { params: Promise<{ guildId: string; panelId: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { guildId, panelId } = await params;
  const access = await getGuildAccess(guildId);
  if (!access.ok) return guildAccessErrorResponse(access.reason);

  const json = await request.json().catch(() => null);
  const parsed = reactionRolePanelInputSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Datos inválidos.", 400);
  }

  try {
    const panel = await updateReactionRolePanel(guildId, panelId, parsed.data);
    return apiSuccess(panel);
  } catch (err) {
    if (err instanceof ReactionRolePanelNotFoundError) {
      return apiError("NOT_FOUND", "Panel no encontrado.", 404);
    }
    if (err instanceof ReactionRoleValidationError) {
      return apiError("VALIDATION_ERROR", err.message, 400);
    }
    return apiError("DISCORD_ERROR", translateDiscordError(err), 502);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { guildId, panelId } = await params;
  const access = await getGuildAccess(guildId);
  if (!access.ok) return guildAccessErrorResponse(access.reason);

  try {
    await deleteReactionRolePanel(guildId, panelId);
    return apiSuccess({ deleted: true });
  } catch (err) {
    if (err instanceof ReactionRolePanelNotFoundError) {
      return apiError("NOT_FOUND", "Panel no encontrado.", 404);
    }
    throw err;
  }
}
