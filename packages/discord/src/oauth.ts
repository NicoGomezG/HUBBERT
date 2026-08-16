// Llamadas que usan el access token OAuth2 del *usuario* (no el bot).
// Se usan una sola vez, en el momento del login — ver packages/modules/guilds.

export interface DiscordOAuthGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string; // bitfield como string (puede exceder Number.MAX_SAFE_INTEGER)
}

export async function fetchUserGuilds(accessToken: string): Promise<DiscordOAuthGuild[]> {
  const res = await fetch("https://discord.com/api/v10/users/@me/guilds", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Discord API error ${res.status} al listar guilds del usuario`);
  }

  return res.json();
}

export function guildIconUrl(guildId: string, icon: string | null): string | null {
  if (!icon) return null;
  const ext = icon.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/icons/${guildId}/${icon}.${ext}`;
}
