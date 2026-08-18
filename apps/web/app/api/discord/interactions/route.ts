import { NextResponse, after } from "next/server";
import {
  DISCORD_COMMANDS,
  buildDiscordEmbed,
  editOriginalInteractionResponse,
  hasManageAccess,
  verifyDiscordRequest,
} from "@hubbert/discord";
import {
  CLOSE_TICKET_CUSTOM_ID,
  TicketAlreadyOpenError,
  closeTicket,
  formatBirthdayList,
  listBirthdays,
  openTicket,
  parseOpenTicketCustomId,
} from "@hubbert/modules";

const InteractionType = { PING: 1, APPLICATION_COMMAND: 2, MESSAGE_COMPONENT: 3 } as const;
const InteractionResponseType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
  DEFERRED_UPDATE_MESSAGE: 6,
} as const;
const EPHEMERAL_FLAG = 1 << 6;

interface DiscordInteraction {
  type: number;
  token: string;
  guild_id?: string;
  channel_id?: string;
  data?: { name?: string; custom_id?: string };
  member?: {
    nick?: string | null;
    permissions?: string;
    user?: { id: string; username: string; global_name?: string | null };
  };
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!publicKey) {
    return NextResponse.json({ success: false, error: { code: "NOT_CONFIGURED", message: "" } }, { status: 500 });
  }

  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");
  if (!verifyDiscordRequest(rawBody, signature, timestamp, publicKey)) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "" } }, { status: 401 });
  }

  const interaction = JSON.parse(rawBody) as DiscordInteraction;

  if (interaction.type === InteractionType.PING) {
    return NextResponse.json({ type: InteractionResponseType.PONG });
  }

  if (interaction.type === InteractionType.APPLICATION_COMMAND && interaction.data?.name === "blist") {
    if (!interaction.guild_id) {
      return NextResponse.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: "Este comando solo funciona dentro de un servidor.", flags: EPHEMERAL_FLAG },
      });
    }

    const birthdays = await listBirthdays(interaction.guild_id);
    const description = formatBirthdayList(birthdays);
    const embed = buildDiscordEmbed({ title: "🎂 Cumpleaños registrados", description, color: 0xffd54f });

    return NextResponse.json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { embeds: [embed] },
    });
  }

  if (interaction.type === InteractionType.APPLICATION_COMMAND && interaction.data?.name === "help") {
    const description = DISCORD_COMMANDS.map((c) => `**/${c.name}** — ${c.description}`).join("\n");
    const embed = buildDiscordEmbed({ title: "📖 Comandos disponibles", description, color: 0x5865f2 });

    return NextResponse.json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { embeds: [embed] },
    });
  }

  if (interaction.type === InteractionType.APPLICATION_COMMAND && interaction.data?.name === "dashboard") {
    return NextResponse.json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: "🔗 Integra el servidor, agrega cumpleaños y más desde el panel:\nhttps://hubbert.vercel.app" },
    });
  }

  if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
    const customId = interaction.data?.custom_id ?? "";
    const panelId = parseOpenTicketCustomId(customId);

    if (panelId) {
      if (!interaction.guild_id || !interaction.member?.user) {
        return NextResponse.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: "Este botón solo funciona dentro de un servidor.", flags: EPHEMERAL_FLAG },
        });
      }

      const applicationId = process.env.DISCORD_CLIENT_ID;
      if (!applicationId) {
        return NextResponse.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: "El bot no está configurado correctamente.", flags: EPHEMERAL_FLAG },
        });
      }

      const guildId = interaction.guild_id;
      const user = interaction.member.user;
      const displayName = interaction.member.nick ?? user.global_name ?? user.username;
      const token = interaction.token;

      after(async () => {
        try {
          const ticket = await openTicket(guildId, panelId, user.id, displayName);
          await editOriginalInteractionResponse(applicationId, token, {
            content: `🎫 Tu ticket fue creado: <#${ticket.channelId}>`,
          });
        } catch (err) {
          const content =
            err instanceof TicketAlreadyOpenError
              ? `Ya tienes un ticket abierto: <#${err.channelId}>`
              : "No se pudo crear el ticket. Prueba de nuevo en un rato.";
          await editOriginalInteractionResponse(applicationId, token, { content }).catch(() => {});
        }
      });

      return NextResponse.json({
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
        data: { flags: EPHEMERAL_FLAG },
      });
    }

    if (customId === CLOSE_TICKET_CUSTOM_ID) {
      const channelId = interaction.channel_id;
      const member = interaction.member;
      if (!channelId || !member?.user) {
        return NextResponse.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: "No se pudo procesar la acción.", flags: EPHEMERAL_FLAG },
        });
      }

      const requesterId = member.user.id;
      const requesterHasManageAccess = hasManageAccess(BigInt(member.permissions ?? "0"));

      after(async () => {
        await closeTicket(channelId, requesterId, requesterHasManageAccess).catch(() => {});
      });

      return NextResponse.json({ type: InteractionResponseType.DEFERRED_UPDATE_MESSAGE });
    }
  }

  return NextResponse.json({ success: false, error: { code: "UNKNOWN_COMMAND", message: "" } }, { status: 400 });
}
