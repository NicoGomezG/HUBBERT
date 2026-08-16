import { REST } from "@discordjs/rest";

let rest: REST | undefined;

/**
 * Cliente REST del bot (sin gateway). Se instancia perezosamente para no
 * fallar en tiempo de import si DISCORD_BOT_TOKEN todavía no está seteado
 * (por ejemplo durante `next build` sin env de Discord).
 */
export function getDiscordRest(): REST {
  if (!rest) {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) throw new Error("DISCORD_BOT_TOKEN no está seteado");
    rest = new REST({ version: "10" }).setToken(token);
  }
  return rest;
}
