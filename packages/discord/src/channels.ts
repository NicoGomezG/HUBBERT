import { ChannelType, Routes } from "discord-api-types/v10";
import type { APIChannel } from "discord-api-types/v10";
import { getDiscordRest } from "./client";

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
