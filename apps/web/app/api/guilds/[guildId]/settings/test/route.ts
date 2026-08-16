import { buildDiscordEmbed, sendEmbedToChannel, translateDiscordError } from "@hubbert/discord";
import { sendEmbedSchema } from "@hubbert/modules";
import { getGuildAccess } from "@/lib/guild-access";
import { apiError, apiSuccess, guildAccessErrorResponse } from "@/lib/api-response";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params;
  const access = await getGuildAccess(guildId);
  if (!access.ok) return guildAccessErrorResponse(access.reason);

  const json = await request.json().catch(() => null);
  const parsed = sendEmbedSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Elige un canal.", 400);
  }

  try {
    await sendEmbedToChannel(
      parsed.data.channelId,
      buildDiscordEmbed({
        title: "✅ Hubbert está funcionando",
        description: "Este es un mensaje de prueba enviado desde Configuración.",
        color: 0x146575,
        showTimestamp: true,
      })
    );
    return apiSuccess({ sent: true });
  } catch (err) {
    return apiError("DISCORD_API_ERROR", translateDiscordError(err), 502);
  }
}
