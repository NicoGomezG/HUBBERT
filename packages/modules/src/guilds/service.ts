import { prisma } from "@hubbert/db";
import { fetchUserGuilds, fetchBotGuildIds, guildIconUrl, hasManageAccess } from "@hubbert/discord";

export interface SyncedGuild {
  id: string;
  name: string;
  iconUrl: string | null;
  botInstalled: boolean;
  isOwner: boolean;
}

/**
 * Se corre una sola vez, en el momento del login (ver app/auth/callback).
 * `accessToken` es el token OAuth2 del usuario — se usa acá y se descarta,
 * nunca se persiste (ver blueprint, sección de autenticación).
 */
export async function syncUserGuilds(
  userId: string,
  discordId: string,
  accessToken: string
): Promise<SyncedGuild[]> {
  const [userGuilds, botGuildIds] = await Promise.all([
    fetchUserGuilds(accessToken),
    fetchBotGuildIds(),
  ]);

  const manageable = userGuilds.filter(
    (g) => g.owner || hasManageAccess(BigInt(g.permissions))
  );

  const result: SyncedGuild[] = [];

  for (const g of manageable) {
    const botInstalled = botGuildIds.has(g.id);
    const existing = await prisma.guild.findUnique({ where: { id: g.id } });
    const iconUrl = guildIconUrl(g.id, g.icon);

    await prisma.guild.upsert({
      where: { id: g.id },
      create: {
        id: g.id,
        name: g.name,
        iconUrl,
        ownerDiscordId: g.owner ? discordId : null,
        botInstalledAt: botInstalled ? new Date() : null,
      },
      update: {
        name: g.name,
        iconUrl,
        ...(g.owner ? { ownerDiscordId: discordId } : {}),
        // No pisar botInstalledAt si ya estaba seteado y el bot sigue ahí;
        // limpiarlo si el bot ya no está.
        botInstalledAt: botInstalled
          ? (existing?.botInstalledAt ?? new Date())
          : null,
      },
    });

    await prisma.guildMember.upsert({
      where: { userId_guildId: { userId, guildId: g.id } },
      create: {
        userId,
        guildId: g.id,
        permissions: BigInt(g.permissions),
        isOwner: g.owner,
      },
      update: {
        permissions: BigInt(g.permissions),
        isOwner: g.owner,
        lastSyncedAt: new Date(),
      },
    });

    if (botInstalled) {
      await prisma.guildSettings.upsert({
        where: { guildId: g.id },
        create: { guildId: g.id },
        update: {},
      });
    }

    result.push({ id: g.id, name: g.name, iconUrl, botInstalled, isOwner: g.owner });
  }

  return result;
}
