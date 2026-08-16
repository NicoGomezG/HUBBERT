import { NextResponse } from "next/server";
import { buildDiscordEmbed, sendEmbedToChannel, validateEmbedInput } from "@hubbert/discord";

/**
 * Endpoint temporal para el smoke test del Paso 0.5 — confirma que
 * packages/discord manda embeds reales con el token del bot. Sin guard de
 * permisos porque todavía no existe auth (Paso 1). Se reemplaza por el
 * flujo real (con guard + embed guardado en DB) en el Paso 4.
 */
export async function POST() {
  const channelId = process.env.DISCORD_TEST_CHANNEL_ID;
  if (!channelId) {
    return NextResponse.json(
      { success: false, error: { code: "MISSING_CHANNEL", message: "Falta DISCORD_TEST_CHANNEL_ID en .env.local" } },
      { status: 400 }
    );
  }

  const input = {
    title: "🎉 Hubbert — smoke test",
    description: "Si ves esto, la cadena API → packages/discord → Discord REST funciona de punta a punta.",
    color: 0x146575,
    footerText: "Hubbert · Paso 0.5",
    showTimestamp: true,
    fields: [
      { name: "Módulo", value: "embeds", inline: true },
      { name: "Estado", value: "conectado", inline: true },
    ],
  };

  const errors = validateEmbedInput(input);
  if (errors.length > 0) {
    return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: errors.join(" ") } }, { status: 400 });
  }

  try {
    const message = await sendEmbedToChannel(channelId, buildDiscordEmbed(input));
    return NextResponse.json({ success: true, data: { messageId: message.id } });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { code: "DISCORD_API_ERROR", message: err instanceof Error ? err.message : "Unknown error" } },
      { status: 502 }
    );
  }
}
