import { Routes } from "discord-api-types/v10";
import type { APIEmbed, APIMessage, APIUser, APIWebhook } from "discord-api-types/v10";
import { getDiscordRest } from "./client";

const WEBHOOK_NAME = "Hubbert";

export interface WebhookSender {
  username?: string | null;
  avatarUrl?: string | null;
}

/**
 * Reutiliza el webhook que el bot ya creó en el canal, o crea uno. Discord
 * limita a 15 webhooks por canal, así que no se crea uno por envío.
 * Requiere el permiso Gestionar webhooks en el canal.
 */
async function getOrCreateChannelWebhook(channelId: string): Promise<{ id: string; token: string }> {
  const rest = getDiscordRest();
  const [botUser, webhooks] = (await Promise.all([
    rest.get(Routes.user()),
    rest.get(Routes.channelWebhooks(channelId)),
  ])) as [APIUser, APIWebhook[]];

  const existing = webhooks.find((w) => w.user?.id === botUser.id && w.token);
  if (existing?.token) return { id: existing.id, token: existing.token };

  const created = (await rest.post(Routes.channelWebhooks(channelId), {
    body: { name: WEBHOOK_NAME },
  })) as APIWebhook;
  if (!created.token) throw new Error("Discord no devolvió el token del webhook.");
  return { id: created.id, token: created.token };
}

/** Envía un embed con nombre y avatar personalizados (como hacen message.style o Discohook). */
export async function sendEmbedAsWebhook(
  channelId: string,
  embed: APIEmbed,
  sender: WebhookSender
): Promise<APIMessage> {
  const webhook = await getOrCreateChannelWebhook(channelId);

  return (await getDiscordRest().post(Routes.webhook(webhook.id, webhook.token), {
    body: {
      embeds: [embed],
      username: sender.username ?? undefined,
      avatar_url: sender.avatarUrl ?? undefined,
    },
    query: new URLSearchParams({ wait: "true" }),
    auth: false,
  })) as APIMessage;
}
