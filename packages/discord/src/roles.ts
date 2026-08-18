import { Routes } from "discord-api-types/v10";
import type { APIRole } from "discord-api-types/v10";
import { getDiscordRest } from "./client";
import { PERMISSION_BITS } from "./permissions";

export interface DiscordRole {
  id: string;
  name: string;
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
