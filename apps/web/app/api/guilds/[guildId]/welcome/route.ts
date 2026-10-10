import { translateDiscordError } from "@hubbert/discord";
import {
  WelcomeValidationError,
  getWelcomeSettings,
  updateWelcomeSettings,
  welcomeSettingsInputSchema,
} from "@hubbert/modules";
import { getGuildAccess } from "@/lib/guild-access";
import { apiError, apiSuccess, guildAccessErrorResponse } from "@/lib/api-response";

export async function GET(_request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const access = await getGuildAccess(guildId);
  if (!access.ok) return guildAccessErrorResponse(access.reason);

  return apiSuccess(await getWelcomeSettings(guildId));
}

export async function PUT(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const access = await getGuildAccess(guildId);
  if (!access.ok) return guildAccessErrorResponse(access.reason);

  const json = await request.json().catch(() => null);
  const parsed = welcomeSettingsInputSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Datos inválidos.", 400);
  }

  try {
    return apiSuccess(await updateWelcomeSettings(guildId, parsed.data));
  } catch (err) {
    if (err instanceof WelcomeValidationError) return apiError("VALIDATION_ERROR", err.message, 400);
    return apiError("DISCORD_ERROR", translateDiscordError(err), 502);
  }
}
