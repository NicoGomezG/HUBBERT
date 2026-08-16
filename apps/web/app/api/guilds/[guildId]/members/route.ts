import { fetchGuildMembers } from "@hubbert/discord";
import { getGuildAccess } from "@/lib/guild-access";
import { apiSuccess, guildAccessErrorResponse } from "@/lib/api-response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params;
  const access = await getGuildAccess(guildId);
  if (!access.ok) return guildAccessErrorResponse(access.reason);

  const members = await fetchGuildMembers(guildId);
  return apiSuccess(members);
}
