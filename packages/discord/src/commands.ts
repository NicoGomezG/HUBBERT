import { Routes } from "discord-api-types/v10";
import { getDiscordRest } from "./client";

// type: 1 = CHAT_INPUT (slash command).
export const DISCORD_COMMANDS = [
  {
    name: "blist",
    description: "Muestra la lista completa de cumpleaños registrados en este servidor",
    type: 1,
  },
  {
    name: "rlist",
    description: "Muestra la lista de recordatorios registrados en este servidor",
    type: 1,
  },
  {
    name: "help",
    description: "Muestra los comandos disponibles del bot",
    type: 1,
  },
  {
    name: "dashboard",
    description: "Muestra el link del panel para integrar el servidor y gestionar cumpleaños",
    type: 1,
  },
] as const;

export async function registerGlobalCommands(applicationId: string): Promise<void> {
  await getDiscordRest().put(Routes.applicationCommands(applicationId), { body: DISCORD_COMMANDS });
}
