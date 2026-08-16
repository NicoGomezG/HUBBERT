import { Routes } from "discord-api-types/v10";
import type { APIEmbed, APIMessage } from "discord-api-types/v10";
import { getDiscordRest } from "./client";

export async function sendEmbedToChannel(
  channelId: string,
  embed: APIEmbed
): Promise<APIMessage> {
  return (await getDiscordRest().post(Routes.channelMessages(channelId), {
    body: { embeds: [embed] },
  })) as APIMessage;
}
