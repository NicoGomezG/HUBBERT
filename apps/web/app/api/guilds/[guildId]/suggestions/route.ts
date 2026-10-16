// Recibe una sugerencia desde el panel y la reenvía al canal del desarrollador vía Webhook de Discord.
// La URL vive solo en DISCORD_SUGGESTIONS_WEBHOOK_URL y nunca llega al navegador.
import { getGuildAccess } from "@/lib/guild-access";
import { getCurrentUser } from "@/lib/supabase/server";
import { apiError, apiSuccess, guildAccessErrorResponse } from "@/lib/api-response";
import {
  SUGGESTION_CATEGORIES,
  SUGGESTION_DESCRIPTION_MAX,
  SUGGESTION_DESCRIPTION_MIN,
  SUGGESTION_TITLE_MAX,
  type SuggestionCategory as Category,
} from "@/lib/suggestions";

// Una sugerencia por usuario cada minuto. Vive en memoria del proceso: alcanza para frenar el doble click
// y el spam casual (no es un límite global si hay varias instancias).
const COOLDOWN_MS = 60_000;
const lastSentAt = new Map<string, number>();

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const access = await getGuildAccess(guildId);
  if (!access.ok) return guildAccessErrorResponse(access.reason);

  const webhookUrl = process.env.DISCORD_SUGGESTIONS_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error("Falta la variable de entorno DISCORD_SUGGESTIONS_WEBHOOK_URL");
    return apiError("NOT_CONFIGURED", "Las sugerencias no están disponibles en este momento.", 503);
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const category: Category = Object.hasOwn(SUGGESTION_CATEGORIES, String(body?.category))
    ? (body?.category as Category)
    : "other";
  const title = text(body?.title, SUGGESTION_TITLE_MAX);
  const description = text(body?.description, SUGGESTION_DESCRIPTION_MAX);
  const wantsToDonate = body?.wantsToDonate === true;

  if (title.length < 4) return apiError("VALIDATION_ERROR", "Ponle un título a tu sugerencia.", 400);
  if (description.length < SUGGESTION_DESCRIPTION_MIN) {
    return apiError(
      "VALIDATION_ERROR",
      `Cuéntanos un poco más: la descripción necesita al menos ${SUGGESTION_DESCRIPTION_MIN} caracteres.`,
      400
    );
  }

  const now = Date.now();
  const last = lastSentAt.get(access.discordId);
  if (last && now - last < COOLDOWN_MS) {
    const seconds = Math.ceil((COOLDOWN_MS - (now - last)) / 1000);
    return apiError("RATE_LIMITED", `Espera ${seconds} s antes de mandar otra sugerencia.`, 429);
  }

  const user = await getCurrentUser();
  const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const userName = String(metadata.full_name ?? metadata.name ?? metadata.user_name ?? "Usuario");
  const avatarUrl = typeof metadata.avatar_url === "string" ? metadata.avatar_url : undefined;
  const cat = SUGGESTION_CATEGORIES[category];

  const payload = {
    username: "Hubbert · Sugerencias",
    // Vacío: el texto del usuario nunca puede disparar @everyone, @here ni menciones a roles.
    allowed_mentions: { parse: [] },
    embeds: [
      {
        author: { name: userName, icon_url: avatarUrl },
        title: `${cat.emoji} ${title}`,
        description,
        color: wantsToDonate ? 0xeb459e : cat.color,
        fields: [
          { name: "Tipo", value: cat.label, inline: true },
          { name: "Servidor", value: `${access.guild.name}\n\`${guildId}\``, inline: true },
          { name: "Usuario", value: `<@${access.discordId}>\n\`${access.discordId}\``, inline: true },
          ...(wantsToDonate ? [{ name: "💜 Apoyo", value: "Quiere donar para impulsar esta idea.", inline: false }] : []),
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error("Discord webhook error:", res.status, await res.text());
      return apiError("DISCORD_API_ERROR", "No se pudo enviar la sugerencia. Intenta de nuevo en un rato.", 502);
    }
  } catch (err) {
    console.error("Error enviando sugerencia a Discord:", err);
    return apiError("DISCORD_API_ERROR", "No se pudo enviar la sugerencia. Intenta de nuevo en un rato.", 502);
  }

  lastSentAt.set(access.discordId, now);
  return apiSuccess({ sent: true });
}
