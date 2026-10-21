import { countBroadcastRecipients } from "@hubbert/modules";
import { translateDiscordError } from "@hubbert/discord";
import { getGuildAccess } from "@/lib/guild-access";
import { apiError, apiSuccess, guildAccessErrorResponse } from "@/lib/api-response";

/** Cuántos miembros recibirían el envío con los roles de ?roleIds=a,b. */
export async function GET(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const access = await getGuildAccess(guildId);
  if (!access.ok) return guildAccessErrorResponse(access.reason);

  const roleIds = (new URL(request.url).searchParams.get("roleIds") ?? "").split(",").filter(Boolean);

  try {
    return apiSuccess({ count: await countBroadcastRecipients(guildId, roleIds) });
  } catch (err) {
    return apiError("DISCORD_API_ERROR", translateDiscordError(err), 502);
  }
}
