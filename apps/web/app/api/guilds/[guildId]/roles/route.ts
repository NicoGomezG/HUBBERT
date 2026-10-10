import { fetchAssignableRoles, translateDiscordError } from "@hubbert/discord";
import { getGuildAccess } from "@/lib/guild-access";
import { apiError, apiSuccess, guildAccessErrorResponse } from "@/lib/api-response";

export async function GET(_request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const access = await getGuildAccess(guildId);
  if (!access.ok) return guildAccessErrorResponse(access.reason);

  try {
    return apiSuccess(await fetchAssignableRoles(guildId));
  } catch (err) {
    return apiError("DISCORD_ERROR", translateDiscordError(err), 502);
  }
}
