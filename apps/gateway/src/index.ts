import { Client, GatewayDispatchEvents, GatewayIntentBits } from "@discordjs/core";
import { WebSocketManager } from "@discordjs/ws";
import { prisma } from "@hubbert/db";
import { getDiscordRest, translateDiscordError } from "@hubbert/discord";
import {
  handleReactionAdd,
  handleReactionRemove,
  listReactionRolePanelMessageIds,
  type ReactionEvent,
} from "@hubbert/modules";

/**
 * Proceso siempre encendido conectado al Gateway de Discord. Existe solo
 * porque las reacciones no llegan por el webhook de interacciones que usa
 * apps/web: todo lo demás del bot sigue siendo serverless.
 */

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) throw new Error("DISCORD_BOT_TOKEN no está seteado");

// Cada reacción en cualquier mensaje de cualquier servidor llega acá; este set
// evita ir a la base por las que no son de un panel. Un panel recién creado
// empieza a funcionar en el próximo refresco.
const PANEL_REFRESH_MS = 15_000;
let panelMessageIds = new Set<string>();

async function refreshPanelMessageIds() {
  try {
    panelMessageIds = new Set(await listReactionRolePanelMessageIds());
  } catch (err) {
    console.error("[gateway] no se pudo refrescar la lista de paneles:", err);
  }
}

const rest = getDiscordRest();
const gateway = new WebSocketManager({
  token,
  intents: GatewayIntentBits.GuildMessageReactions,
  rest,
});
const client = new Client({ rest, gateway });

let botUserId: string | null = null;

client.once(GatewayDispatchEvents.Ready, ({ data }) => {
  botUserId = data.user.id;
  console.log(`[gateway] conectado como ${data.user.username} (${data.guilds.length} servidores)`);
});

interface RawReaction {
  guild_id?: string;
  channel_id: string;
  message_id: string;
  user_id: string;
  emoji: { id: string | null; name: string | null };
  member?: { roles: string[]; user?: { bot?: boolean } };
}

function toReactionEvent(data: RawReaction): ReactionEvent | null {
  if (!data.guild_id || data.user_id === botUserId || data.member?.user?.bot) return null;
  if (!panelMessageIds.has(data.message_id)) return null;

  return {
    guildId: data.guild_id,
    channelId: data.channel_id,
    messageId: data.message_id,
    userId: data.user_id,
    emoji: { id: data.emoji.id, name: data.emoji.name },
    memberRoleIds: data.member?.roles,
  };
}

async function run(kind: string, event: ReactionEvent, handler: (e: ReactionEvent) => Promise<void>) {
  try {
    await handler(event);
  } catch (err) {
    console.error(
      `[gateway] ${kind} falló (guild ${event.guildId}, usuario ${event.userId}):`,
      translateDiscordError(err)
    );
  }
}

client.on(GatewayDispatchEvents.MessageReactionAdd, ({ data }) => {
  const event = toReactionEvent(data);
  if (event) void run("reaction add", event, handleReactionAdd);
});

client.on(GatewayDispatchEvents.MessageReactionRemove, ({ data }) => {
  const event = toReactionEvent(data);
  if (event) void run("reaction remove", event, handleReactionRemove);
});

async function shutdown() {
  console.log("[gateway] cerrando…");
  await gateway.destroy();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

async function main() {
  await refreshPanelMessageIds();
  setInterval(refreshPanelMessageIds, PANEL_REFRESH_MS);
  await gateway.connect();
}

main().catch((err) => {
  console.error("[gateway] no se pudo iniciar:", err);
  process.exit(1);
});
