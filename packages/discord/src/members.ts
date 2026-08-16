import { Routes } from "discord-api-types/v10";
import type { APIGuildMember } from "discord-api-types/v10";
import { getDiscordRest } from "./client";

export interface DiscordGuildMember {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

function avatarUrl(userId: string, avatar: string | null | undefined): string | null {
  if (!avatar) return null;
  const ext = avatar.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.${ext}`;
}

/** Hasta 1000 miembros — suficiente para el uso previsto (servidores chicos/medianos). */
export async function fetchGuildMembers(guildId: string): Promise<DiscordGuildMember[]> {
  const members = (await getDiscordRest().get(Routes.guildMembers(guildId), {
    query: new URLSearchParams({ limit: "1000" }),
  })) as APIGuildMember[];

  return members
    .filter((m) => m.user && !m.user.bot)
    .map((m) => ({
      id: m.user!.id,
      displayName: m.nick ?? m.user!.global_name ?? m.user!.username,
      username: m.user!.username,
      avatarUrl: avatarUrl(m.user!.id, m.user!.avatar),
    }));
}
