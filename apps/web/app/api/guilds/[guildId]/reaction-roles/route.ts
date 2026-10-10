import { translateDiscordError } from "@hubbert/discord";
import {
  ReactionRoleValidationError,
  createReactionRolePanel,
  listReactionRolePanels,
  reactionRolePanelInputSchema,
} from "@hubbert/modules";
import { getGuildAccess } from "@/lib/guild-access";
import { apiError, apiSuccess, guildAccessErrorResponse } from "@/lib/api-response";

export async function GET(_request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const access = await getGuildAccess(guildId);
  if (!access.ok) return guildAccessErrorResponse(access.reason);

  const panels = await listReactionRolePanels(guildId);
  return apiSuccess(panels);
}

export async function POST(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const access = await getGuildAccess(guildId);
  if (!access.ok) return guildAccessErrorResponse(access.reason);

  const json = await request.json().catch(() => null);
  const parsed = reactionRolePanelInputSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Datos inválidos.", 400);
  }

  try {
    const panel = await createReactionRolePanel(guildId, access.userId, parsed.data);
    return apiSuccess(panel, 201);
  } catch (err) {
    if (err instanceof ReactionRoleValidationError) {
      return apiError("VALIDATION_ERROR", err.message, 400);
    }
    return apiError("DISCORD_ERROR", translateDiscordError(err), 502);
  }
}
