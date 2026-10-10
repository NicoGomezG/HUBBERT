import { Routes } from "discord-api-types/v10";
import type { APIGuildMember, APIRole } from "discord-api-types/v10";
import { fetchBotUser, getDiscordRest } from "./client";
import { cached, DISCORD_CACHE_TTL_MS } from "./cache";
import { PERMISSION_BITS } from "./permissions";

export interface DiscordRole {
  id: string;
  name: string;
}

export interface AssignableRole extends DiscordRole {
  color: number;
  /** false si el rol está a la misma altura o por encima del rol más alto del bot. */
  assignable: boolean;
}

/** Roles del guild con permiso Administrador o Administrar servidor — se recalcula en cada uso, no se cachea. */
export async function fetchGuildManageRoles(guildId: string): Promise<DiscordRole[]> {
  const roles = (await getDiscordRest().get(Routes.guildRoles(guildId))) as APIRole[];

  return roles
    .filter((r) => {
      const perms = BigInt(r.permissions);
      return (
        (perms & PERMISSION_BITS.ADMINISTRATOR) === PERMISSION_BITS.ADMINISTRATOR ||
        (perms & PERMISSION_BITS.MANAGE_GUILD) === PERMISSION_BITS.MANAGE_GUILD
      );
    })
    .map((r) => ({ id: r.id, name: r.name }));
}

/**
 * Roles que un usuario podría recibir del bot: excluye @everyone y los roles
 * administrados por integraciones (bots, boosts). Discord solo deja asignar
 * roles que estén por debajo del rol más alto del bot.
 */
export async function fetchAssignableRoles(guildId: string): Promise<AssignableRole[]> {
  return cached(`assignable-roles:${guildId}`, DISCORD_CACHE_TTL_MS, async () => {
    const rest = getDiscordRest();
    const botUser = await fetchBotUser();
    const [roles, botMember] = (await Promise.all([
      rest.get(Routes.guildRoles(guildId)),
      rest.get(Routes.guildMember(guildId, botUser.id)),
    ])) as [APIRole[], APIGuildMember];
    return toAssignableRoles(guildId, roles, botMember);
  });
}

function toAssignableRoles(guildId: string, roles: APIRole[], botMember: APIGuildMember): AssignableRole[] {
  const positions = new Map(roles.map((r) => [r.id, r.position]));
  const botTopPosition = Math.max(0, ...botMember.roles.map((id) => positions.get(id) ?? 0));

  return roles
    .filter((r) => r.id !== guildId && !r.managed)
    .sort((a, b) => b.position - a.position)
    .map((r) => ({ id: r.id, name: r.name, color: r.color, assignable: r.position < botTopPosition }));
}

export async function addMemberRole(guildId: string, userId: string, roleId: string, reason?: string): Promise<void> {
  await getDiscordRest().put(Routes.guildMemberRole(guildId, userId, roleId), { reason });
}

export async function removeMemberRole(guildId: string, userId: string, roleId: string, reason?: string): Promise<void> {
  await getDiscordRest().delete(Routes.guildMemberRole(guildId, userId, roleId), { reason });
}
