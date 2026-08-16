import { Routes } from "discord-api-types/v10";
import { getDiscordRest } from "./client";

/** Guilds donde el bot está presente ahora mismo, según su propio token. */
export async function fetchBotGuildIds(): Promise<Set<string>> {
  const guilds = (await getDiscordRest().get(Routes.userGuilds())) as { id: string }[];
  return new Set(guilds.map((g) => g.id));
}
