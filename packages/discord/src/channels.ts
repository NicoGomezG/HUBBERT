import { ChannelType, OverwriteType, Routes } from "discord-api-types/v10";
import type { APIChannel } from "discord-api-types/v10";
import { getDiscordRest } from "./client";
import { PERMISSION_BITS } from "./permissions";

export interface DiscordTextChannel {
  id: string;
  name: string;
  position: number;
}

export async function fetchGuildTextChannels(guildId: string): Promise<DiscordTextChannel[]> {
  const channels = (await getDiscordRest().get(Routes.guildChannels(guildId))) as APIChannel[];

  return channels
    .filter((c): c is APIChannel & { position: number } => c.type === ChannelType.GuildText)
    .map((c) => ({ id: c.id, name: c.name ?? "sin-nombre", position: c.position }))
    .sort((a, b) => a.position - b.position);
}

export async function fetchGuildCategories(guildId: string): Promise<DiscordTextChannel[]> {
  const channels = (await getDiscordRest().get(Routes.guildChannels(guildId))) as APIChannel[];

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

  return { id: channel.id };
}

export async function deleteChannel(channelId: string): Promise<void> {
  await getDiscordRest().delete(Routes.channel(channelId));
}
