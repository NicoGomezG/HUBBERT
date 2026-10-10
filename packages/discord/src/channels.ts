import { ChannelType, OverwriteType, Routes } from "discord-api-types/v10";
import type { APIChannel } from "discord-api-types/v10";
import { getDiscordRest } from "./client";
import { cached, DISCORD_CACHE_TTL_MS, invalidateCached } from "./cache";
import { PERMISSION_BITS } from "./permissions";

export interface DiscordTextChannel {
  id: string;
  name: string;
  position: number;
}

/** Texto y categorías salen del mismo endpoint: una sola llamada cacheada sirve a ambos. */
function fetchGuildChannels(guildId: string): Promise<APIChannel[]> {
  return cached(
    `channels:${guildId}`,
    DISCORD_CACHE_TTL_MS,
    () => getDiscordRest().get(Routes.guildChannels(guildId)) as Promise<APIChannel[]>
  );
}

export async function fetchGuildTextChannels(guildId: string): Promise<DiscordTextChannel[]> {
  const channels = await fetchGuildChannels(guildId);

  return channels
    .filter((c): c is APIChannel & { position: number } => c.type === ChannelType.GuildText)
    .map((c) => ({ id: c.id, name: c.name ?? "sin-nombre", position: c.position }))
    .sort((a, b) => a.position - b.position);
}

export async function fetchGuildCategories(guildId: string): Promise<DiscordTextChannel[]> {
  const channels = await fetchGuildChannels(guildId);

  return channels
    .filter((c): c is APIChannel & { position: number } => c.type === ChannelType.GuildCategory)
    .map((c) => ({ id: c.id, name: c.name ?? "sin-nombre", position: c.position }))
    .sort((a, b) => a.position - b.position);
}

export interface CreateTicketChannelInput {
  guildId: string;
  name: string;
  parentId?: string | null;
  allowUserId: string;
  allowRoleIds: string[];
}

/** Canal privado: @everyone sin acceso, el usuario y los roles admin con ver+escribir. */
export async function createTicketChannel(input: CreateTicketChannelInput): Promise<{ id: string }> {
  const viewAndSend = String(PERMISSION_BITS.VIEW_CHANNEL | PERMISSION_BITS.SEND_MESSAGES);

  const permissionOverwrites = [
    { id: input.guildId, type: OverwriteType.Role, deny: String(PERMISSION_BITS.VIEW_CHANNEL) },
    { id: input.allowUserId, type: OverwriteType.Member, allow: viewAndSend },
    ...input.allowRoleIds.map((roleId) => ({ id: roleId, type: OverwriteType.Role, allow: viewAndSend })),
  ];

  const channel = (await getDiscordRest().post(Routes.guildChannels(input.guildId), {
    body: {
      name: input.name,
      type: ChannelType.GuildText,
      parent_id: input.parentId ?? undefined,
      permission_overwrites: permissionOverwrites,
    },
  })) as APIChannel;

  invalidateCached(`channels:${input.guildId}`);
  return { id: channel.id };
}

export async function deleteChannel(channelId: string): Promise<void> {
  const deleted = (await getDiscordRest().delete(Routes.channel(channelId))) as APIChannel;
  if ("guild_id" in deleted && deleted.guild_id) invalidateCached(`channels:${deleted.guild_id}`);
}
