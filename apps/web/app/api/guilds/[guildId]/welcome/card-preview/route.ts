import { fetchUser, userAvatarUrl } from "@hubbert/discord";
import { renderCardText } from "@hubbert/modules";
import { getGuildAccess } from "@/lib/guild-access";
import { guildAccessErrorResponse } from "@/lib/api-response";
import { renderWelcomeCard } from "@/lib/welcome-card";

function colorParam(value: string | null, fallback: number): number {
  const parsed = value ? parseInt(value, 16) : NaN;
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 0xffffff ? parsed : fallback;
}

/**
 * Vista previa de la tarjeta con lo que está en el formulario (aunque no se
 * haya guardado), usando el avatar de quien está editando.
 */
export async function GET(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const access = await getGuildAccess(guildId);
  if (!access.ok) return guildAccessErrorResponse(access.reason);

  const query = new URL(request.url).searchParams;
  const user = await fetchUser(access.discordId).catch(() => null);
  const displayName = user?.globalName ?? user?.username ?? "NuevoMiembro";
  const textData = { displayName, guildName: access.guild.name, memberCount: 128 };

  return renderWelcomeCard({
    backgroundUrl: query.get("bg") || null,
    avatarUrl: user
      ? userAvatarUrl(user, { staticImage: true })
      : "https://cdn.discordapp.com/embed/avatars/0.png",
    title: renderCardText((query.get("title") ?? "").slice(0, 60), textData),
    subtitle: renderCardText((query.get("subtitle") ?? "").slice(0, 80), textData),
    accentColor: colorParam(query.get("accent"), 0x5865f2),
    textColor: colorParam(query.get("text"), 0xffffff),
    font: query.get("font") ?? "default",
  });
}
