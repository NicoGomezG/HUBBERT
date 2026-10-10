import { prisma } from "@hubbert/db";
import { userAvatarUrl } from "@hubbert/discord";
import { parseWelcomeCardUrl, renderCardText } from "@hubbert/modules";
import { renderWelcomeCard } from "@/lib/welcome-card";

/**
 * Pública a propósito: la descarga Discord al mostrar el embed de bienvenida.
 * Los datos del miembro vienen firmados en la URL (ver welcome/card.ts).
 */
export async function GET(request: Request) {
  const params = parseWelcomeCardUrl(new URL(request.url).searchParams);
  if (!params) return new Response("Firma inválida", { status: 403 });

  const [settings, guild] = await Promise.all([
    prisma.welcomeSettings.findUnique({ where: { guildId: params.guildId } }),
    prisma.guild.findUnique({ where: { id: params.guildId }, select: { name: true } }),
  ]);
  if (!settings || !guild) return new Response("No encontrado", { status: 404 });

  const textData = {
    displayName: params.displayName,
    guildName: guild.name,
    memberCount: params.memberCount ? Number(params.memberCount) : null,
  };

  return renderWelcomeCard(
    {
      backgroundUrl: settings.cardBackgroundUrl,
      avatarUrl: userAvatarUrl(
        { id: params.userId, username: params.displayName, avatar: params.avatar || null },
        { staticImage: true }
      ),
      title: renderCardText(settings.cardTitle, textData),
      subtitle: renderCardText(settings.cardSubtitle, textData),
      accentColor: settings.welcomeColor ?? 0x5865f2,
      textColor: settings.cardTextColor,
      font: settings.cardFont,
    },
    // La URL incluye la versión de la configuración, así que la imagen nunca cambia para una misma URL.
    { "Cache-Control": "public, max-age=31536000, immutable" }
  );
}
