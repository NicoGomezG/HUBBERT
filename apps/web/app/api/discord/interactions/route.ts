import { NextResponse } from "next/server";
import { buildDiscordEmbed, verifyDiscordRequest } from "@hubbert/discord";
import { formatBirthdayList, listBirthdays } from "@hubbert/modules";

const InteractionType = { PING: 1, APPLICATION_COMMAND: 2 } as const;
const InteractionResponseType = { PONG: 1, CHANNEL_MESSAGE_WITH_SOURCE: 4 } as const;
const EPHEMERAL_FLAG = 1 << 6;

interface DiscordInteraction {
  type: number;
  guild_id?: string;
  data?: { name?: string };
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

  if (interaction.type === InteractionType.APPLICATION_COMMAND && interaction.data?.name === "lista") {
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

  return NextResponse.json({ success: false, error: { code: "UNKNOWN_COMMAND", message: "" } }, { status: 400 });
}
