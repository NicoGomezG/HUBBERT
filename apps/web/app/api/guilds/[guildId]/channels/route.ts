import { listSendableChannels } from "@hubbert/modules";
import { getGuildAccess } from "@/lib/guild-access";
import { apiSuccess, guildAccessErrorResponse } from "@/lib/api-response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params;
  const access = await getGuildAccess(guildId);
  if (!access.ok) return guildAccessErrorResponse(access.reason);

  const channels = await listSendableChannels(guildId);
  return apiSuccess(channels);
}
