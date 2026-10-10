import { Routes } from "discord-api-types/v10";
import type {
  APIEmbed,
  APIMessage,
  RESTPatchAPIChannelMessageJSONBody,
  RESTPostAPIChannelMessageJSONBody,
} from "discord-api-types/v10";
import { getDiscordRest } from "./client";

export async function sendEmbedToChannel(
  channelId: string,
  embed: APIEmbed
): Promise<APIMessage> {
  return (await getDiscordRest().post(Routes.channelMessages(channelId), {
    body: { embeds: [embed] },
  })) as APIMessage;
}

export async function sendMessageToChannel(
  channelId: string,
  body: RESTPostAPIChannelMessageJSONBody
): Promise<APIMessage> {
  return (await getDiscordRest().post(Routes.channelMessages(channelId), { body })) as APIMessage;
}

export async function deleteMessage(channelId: string, messageId: string): Promise<void> {
  await getDiscordRest().delete(Routes.channelMessage(channelId, messageId));
}

export async function editMessage(
  channelId: string,
  messageId: string,
  body: RESTPatchAPIChannelMessageJSONBody
): Promise<void> {
  await getDiscordRest().patch(Routes.channelMessage(channelId, messageId), { body });
}
