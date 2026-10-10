import { ImageResponse } from "next/og";
import { findCardFont } from "@hubbert/modules/client";

export const WELCOME_CARD_SIZE = { width: 1024, height: 450 };

// Satori (el motor de next/og) solo dibuja PNG y JPEG de forma confiable.
const SUPPORTED_IMAGE_TYPES = ["image/png", "image/jpeg"];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/**
 * Descarga una imagen y la devuelve como data URL, o null si no se puede
 * usar. ImageResponse dibuja mientras hace streaming de la respuesta, así que
 * una URL rota a esa altura rompe la imagen sin poder atrapar el error: por
 * eso se valida antes.
 */
async function loadImage(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const type = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
    if (!res.ok || !SUPPORTED_IMAGE_TYPES.includes(type)) return null;
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_IMAGE_BYTES) return null;
    return `data:${type};base64,${Buffer.from(buffer).toString("base64")}`;
  } catch {
    return null;
  }
}

type CardFont = ReturnType<typeof findCardFont>;
type LoadedFont = { name: string; data: ArrayBuffer; weight: 400 | 500 | 700 | 800; style: "normal" };

// Por instancia del servidor: la misma fuente con el mismo texto no se vuelve a descargar.
const fontCache = new Map<string, Promise<ArrayBuffer | null>>();

/**
 * Descarga de Google Fonts solo las letras de `text` (el archivo pesa ~1-2 KB).
 * Sin user agent de navegador, Google responde con TTF, que es lo que soporta
 * Satori (no soporta WOFF2).
 */
function fetchGoogleFont(family: string, weight: number, text: string): Promise<ArrayBuffer | null> {
  const key = `${family}:${weight}:${text}`;
  let cached = fontCache.get(key);
  if (!cached) {
    cached = (async () => {
      try {
        const query = new URLSearchParams({ family: `${family}:wght@${weight}`, text });
        const css = await fetch(`https://fonts.googleapis.com/css2?${query}`, {
          signal: AbortSignal.timeout(4000),
        }).then((r) => (r.ok ? r.text() : ""));
        const url = css.match(/src: url\((.+?)\)/)?.[1];
        if (!url) return null;
        const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
        return res.ok ? await res.arrayBuffer() : null;
      } catch {
        return null;
      }
    })();
    fontCache.set(key, cached);
    // Si falló, no se deja en caché: se reintenta en la próxima tarjeta.
    void cached.then((data) => {
      if (!data) fontCache.delete(key);
    });
  }
  return cached;
}

async function loadCardFonts(font: CardFont, title: string, subtitle: string): Promise<LoadedFont[]> {
  if (!font.family) return [];
  const text = `${title}${subtitle}`;
  const weights = [...new Set([font.titleWeight, font.subtitleWeight])];
  const loaded = await Promise.all(weights.map((w) => fetchGoogleFont(font.family!, w, text)));
  return weights.flatMap((weight, i) => {
    const data = loaded[i];
    return data ? [{ name: font.family!, data, weight: weight as LoadedFont["weight"], style: "normal" as const }] : [];
  });
}

function hex(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}

export interface WelcomeCardData {
  backgroundUrl: string | null;
  avatarUrl: string;
  title: string;
  subtitle: string;
  /** Color del aro del avatar y del degradado cuando no hay fondo. */
  accentColor: number;
  textColor: number;
  /** Clave de CARD_FONTS. */
  font: string;
}

export async function renderWelcomeCard(data: WelcomeCardData, headers?: Record<string, string>) {
  const font = findCardFont(data.font);
  const [background, avatar, fonts] = await Promise.all([
    loadImage(data.backgroundUrl),
    loadImage(data.avatarUrl),
    loadCardFonts(font, data.title, data.subtitle),
  ]);
  // Si Google Fonts no respondió, se dibuja con la fuente predeterminada en vez de fallar.
  // Satori falla con `fontFamily: undefined`, así que la propiedad solo se agrega si hay fuente.
  const fontStyle = fonts.length > 0 ? { fontFamily: `"${font.family}"` } : {};
  const scale = fonts.length > 0 && "scale" in font ? font.scale : 1;
  const accent = hex(data.accentColor);
  const textShadow = "0 2px 8px rgba(0,0,0,0.6)";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: `linear-gradient(135deg, ${accent} 0%, #1e1f22 100%)`,
        }}
      >
        {background && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={background}
            alt=""
            width={WELCOME_CARD_SIZE.width}
            height={WELCOME_CARD_SIZE.height}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: 32,
            background: "rgba(0,0,0,0.35)",
            color: hex(data.textColor),
            ...fontStyle,
          }}
        >
          {avatar && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt=""
              width={200}
              height={200}
              style={{ borderRadius: "50%", border: `8px solid ${accent}`, boxShadow: "0 4px 24px rgba(0,0,0,0.5)" }}
            />
          )}
          {data.title && (
            <div style={{ fontSize: 64 * scale, fontWeight: font.titleWeight, textAlign: "center", textShadow }}>
              {data.title}
            </div>
          )}
          {data.subtitle && (
            <div style={{ fontSize: 34 * scale, fontWeight: font.subtitleWeight, textAlign: "center", opacity: 0.95, textShadow }}>
              {data.subtitle}
            </div>
          )}
        </div>
      </div>
    ),
    { ...WELCOME_CARD_SIZE, headers, fonts: fonts.length > 0 ? fonts : undefined }
  );
}
