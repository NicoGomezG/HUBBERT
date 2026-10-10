import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { HUBBERT_LINKS } from "./message";

/**
 * La tarjeta de bienvenida es una imagen que genera apps/web en
 * /api/cards/welcome; el embed solo lleva su URL y Discord la descarga.
 * Los datos del miembro van en la URL, firmados, para que la ruta no sirva
 * como generador de imágenes con texto arbitrario.
 */

export interface WelcomeCardParams {
  guildId: string;
  userId: string;
  /** Hash del avatar de Discord (vacío si usa el avatar por defecto). */
  avatar: string;
  displayName: string;
  /** Vacío si Discord no devolvió el conteo. */
  memberCount: string;
  /** Marca de la configuración (updatedAt): cambia la URL cuando se edita la tarjeta. */
  version: string;
}

const PARAM_KEYS = {
  guildId: "g",
  userId: "u",
  avatar: "a",
  displayName: "n",
  memberCount: "c",
  version: "v",
} as const satisfies Record<keyof WelcomeCardParams, string>;

// La clave sale del token del bot, que ya tienen tanto apps/web como apps/gateway:
// así no hace falta configurar otra variable de entorno.
function signingKey(): Buffer {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error("DISCORD_BOT_TOKEN no está seteado");
  return createHash("sha256").update(`hubbert-welcome-card:${token}`).digest();
}

function sign(params: WelcomeCardParams): string {
  const payload = (Object.keys(PARAM_KEYS) as (keyof WelcomeCardParams)[]).map((k) => params[k]).join("\n");
  return createHmac("sha256", signingKey()).update(payload).digest("base64url").slice(0, 32);
}

function appUrl(): string {
  return (process.env.PUBLIC_APP_URL ?? HUBBERT_LINKS.dashboard).replace(/\/$/, "");
}

export function buildWelcomeCardUrl(params: WelcomeCardParams): string {
  const query = new URLSearchParams();
  for (const [key, short] of Object.entries(PARAM_KEYS)) {
    query.set(short, params[key as keyof WelcomeCardParams]);
  }
  query.set("s", sign(params));
  return `${appUrl()}/api/cards/welcome?${query.toString()}`;
}

/** Devuelve los parámetros si la firma es válida, o null. */
export function parseWelcomeCardUrl(searchParams: URLSearchParams): WelcomeCardParams | null {
  const params = Object.fromEntries(
    Object.entries(PARAM_KEYS).map(([key, short]) => [key, searchParams.get(short) ?? ""])
  ) as unknown as WelcomeCardParams;
  if (!params.guildId || !params.userId) return null;

  const expected = Buffer.from(sign(params));
  const received = Buffer.from(searchParams.get("s") ?? "");
  return expected.length === received.length && timingSafeEqual(expected, received) ? params : null;
}
