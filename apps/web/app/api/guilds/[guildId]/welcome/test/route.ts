import { fetchUser, translateDiscordError } from "@hubbert/discord";
import { WelcomeValidationError, sendGoodbye, sendWelcome, welcomeTestSchema } from "@hubbert/modules";
import { getGuildAccess } from "@/lib/guild-access";
import { apiError, apiSuccess, guildAccessErrorResponse } from "@/lib/api-response";

/** Manda la bienvenida (al canal) o la despedida (por DM) simulando que quien prueba es el miembro. */
export async function POST(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const access = await getGuildAccess(guildId);
  if (!access.ok) return guildAccessErrorResponse(access.reason);

  const json = await request.json().catch(() => null);
  const parsed = welcomeTestSchema.safeParse(json);
  if (!parsed.success) return apiError("VALIDATION_ERROR", "Tipo de prueba inválido.", 400);

  try {
    const member = await fetchUser(access.discordId);
    const send = parsed.data.kind === "welcome" ? sendWelcome : sendGoodbye;
    const message = await send(guildId, member, { force: true });
    if (!message) return apiError("VALIDATION_ERROR", "Guarda la configuración antes de probar.", 400);
    return apiSuccess({ messageId: message.id });
  } catch (err) {
    if (err instanceof WelcomeValidationError) return apiError("VALIDATION_ERROR", err.message, 400);
    return apiError("DISCORD_ERROR", translateDiscordError(err), 502);
  }
}
