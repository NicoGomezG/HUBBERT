import { Routes } from "discord-api-types/v10";
import type { APIEmoji } from "discord-api-types/v10";
import { getDiscordRest } from "./client";

export interface ParsedEmoji {
  /** Como se escribe en un mensaje/embed: "🎮" o "<:nombre:123>". */
  display: string;
  /** Clave estable para comparar con los eventos del gateway. */
  key: string;
  /** Identificador que espera la API de reacciones: "🎮" o "nombre:123". */
  reactionId: string;
}

export interface DiscordGuildEmoji {
  id: string;
  name: string;
  animated: boolean;
  display: string;
  imageUrl: string;
}

const CUSTOM_EMOJI_RE = /^<(a?):(\w{2,32}):(\d{17,20})>$/;
const UNICODE_EMOJI_RE = /^(?:\p{Extended_Pictographic}|\p{Regional_Indicator}|[#*0-9]️?⃣)/u;

// Discord a veces devuelve el emoji con U+FE0F y a veces sin él (❤ vs ❤️).
function unicodeKey(emoji: string): string {
  return emoji.replaceAll("️", "");
}

/** Acepta un emoji unicode o uno custom en formato `<:nombre:id>` / `<a:nombre:id>`. */
export function parseEmoji(input: string): ParsedEmoji | null {
  const value = input.trim();

  const custom = CUSTOM_EMOJI_RE.exec(value);
  if (custom) {
    const [, animated, name, id] = custom as unknown as [string, string, string, string];
    return { display: `<${animated}:${name}:${id}>`, key: id, reactionId: `${name}:${id}` };
  }

  if (!UNICODE_EMOJI_RE.test(value) || [...new Intl.Segmenter().segment(value)].length !== 1) return null;
  return { display: value, key: unicodeKey(value), reactionId: value };
}

/** Lo mismo que `parseEmoji` pero a partir del emoji que trae un evento de reacción. */
export function parseGatewayEmoji(emoji: { id: string | null; name: string | null }): ParsedEmoji | null {
  if (emoji.id) {
    const name = emoji.name ?? "_";
    return { display: `<:${name}:${emoji.id}>`, key: emoji.id, reactionId: `${name}:${emoji.id}` };
  }
  if (!emoji.name) return null;
  return { display: emoji.name, key: unicodeKey(emoji.name), reactionId: emoji.name };
}

export async function fetchGuildEmojis(guildId: string): Promise<DiscordGuildEmoji[]> {
  const emojis = (await getDiscordRest().get(Routes.guildEmojis(guildId))) as APIEmoji[];

  return emojis
    .filter((e): e is APIEmoji & { id: string; name: string } => Boolean(e.id && e.name) && e.available !== false)
    .map((e) => ({
      id: e.id,
      name: e.name,
      animated: Boolean(e.animated),
      display: `<${e.animated ? "a" : ""}:${e.name}:${e.id}>`,
      imageUrl: `https://cdn.discordapp.com/emojis/${e.id}.${e.animated ? "gif" : "png"}`,
    }));
}

export async function addReaction(channelId: string, messageId: string, reactionId: string): Promise<void> {
  await getDiscordRest().put(
    Routes.channelMessageOwnReaction(channelId, messageId, encodeURIComponent(reactionId))
  );
}

/** Requiere el permiso Gestionar mensajes en el canal. */
export async function removeUserReaction(
  channelId: string,
  messageId: string,
  reactionId: string,
  userId: string
): Promise<void> {
  await getDiscordRest().delete(
    Routes.channelMessageUserReaction(channelId, messageId, encodeURIComponent(reactionId), userId)
  );
}

/** Quita todas las reacciones de un emoji en el mensaje. Requiere Gestionar mensajes. */
export async function removeAllReactionsForEmoji(
  channelId: string,
  messageId: string,
  reactionId: string
): Promise<void> {
  await getDiscordRest().delete(Routes.channelMessageReaction(channelId, messageId, encodeURIComponent(reactionId)));
}
