import { Routes } from "discord-api-types/v10";
import type { APIChannel, APIGuild, APIMessage, APIUser, RESTPostAPIChannelMessageJSONBody } from "discord-api-types/v10";
import { getDiscordRest } from "./client";

export interface DiscordUserInfo {
  id: string;
  username: string;
  globalName?: string | null;
  avatar?: string | null;
}

/** Avatar del usuario, o el avatar por defecto de Discord si no tiene uno. */
export function userAvatarUrl(user: DiscordUserInfo): string {
  if (user.avatar) {
    const ext = user.avatar.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=256`;
  }
  const index = Number((BigInt(user.id) >> BigInt(22)) % BigInt(6));
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

export async function fetchUser(userId: string): Promise<DiscordUserInfo> {
  const user = (await getDiscordRest().get(Routes.user(userId))) as APIUser;
  return { id: user.id, username: user.username, globalName: user.global_name, avatar: user.avatar };
}

/** Nombre del servidor y cantidad aproximada de miembros (Discord la actualiza con unos segundos de retraso). */
export async function fetchGuildSummary(guildId: string): Promise<{ name: string; memberCount: number | null }> {
  const guild = (await getDiscordRest().get(Routes.guild(guildId), {
    query: new URLSearchParams({ with_counts: "true" }),
  })) as APIGuild;
  return { name: guild.name, memberCount: guild.approximate_member_count ?? null };
}

/**
 * Manda un DM. Discord responde 50007 si el usuario tiene los DMs cerrados o
 * ya no comparte ningún servidor con el bot — el caller decide si ignorarlo.
 */
export async function sendDirectMessage(userId: string, body: RESTPostAPIChannelMessageJSONBody): Promise<APIMessage> {
  const rest = getDiscordRest();
  const channel = (await rest.post(Routes.userChannels(), { body: { recipient_id: userId } })) as APIChannel;
  return (await rest.post(Routes.channelMessages(channel.id), { body })) as APIMessage;
}
