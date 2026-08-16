import { prisma, type Guild } from "@hubbert/db";
import { hasManageAccess } from "@hubbert/discord";
import { createSupabaseServerClient } from "./supabase/server";

export type GuildAccess =
  | { ok: true; userId: string; discordId: string; guild: Guild; isOwner: boolean }
  | { ok: false; reason: "unauthenticated" | "not_member" | "bot_not_installed" };

/**
 * Guard central: sesión válida → pertenece a la guild → tiene permiso de
 * administrador → el bot está instalado. Usado tanto por el layout (para
 * decidir qué renderizar) como por cada API route de guilds/[guildId]/**.
 *
 * Nota: usa el bitfield de permisos cacheado en el login (GuildMember).
 * Para escrituras sensibles, revalidar contra Discord con el token del
 * bot antes de ejecutar la acción (ver blueprint, sección de seguridad).
 */
export async function getGuildAccess(guildId: string): Promise<GuildAccess> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, reason: "unauthenticated" };

  const discordId = String(
    (user.user_metadata as Record<string, unknown> | undefined)?.provider_id ?? ""
  );
  if (!discordId) return { ok: false, reason: "unauthenticated" };

  const membership = await prisma.guildMember.findFirst({
    where: { guildId, user: { discordId } },
    include: { guild: true },
  });

  if (!membership) return { ok: false, reason: "not_member" };
  if (!membership.isOwner && !hasManageAccess(membership.permissions)) {
    return { ok: false, reason: "not_member" };
  }
  if (!membership.guild.botInstalledAt) return { ok: false, reason: "bot_not_installed" };

  return {
    ok: true,
    userId: membership.userId,
    discordId,
    guild: membership.guild,
    isOwner: membership.isOwner,
  };
}
