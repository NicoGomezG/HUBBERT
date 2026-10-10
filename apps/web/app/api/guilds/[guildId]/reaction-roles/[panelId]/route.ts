import { ReactionRolePanelNotFoundError, deleteReactionRolePanel } from "@hubbert/modules";
import { getGuildAccess } from "@/lib/guild-access";
import { apiError, apiSuccess, guildAccessErrorResponse } from "@/lib/api-response";

type Params = { params: Promise<{ guildId: string; panelId: string }> };

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
