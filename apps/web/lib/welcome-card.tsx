import { ImageResponse } from "next/og";

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
}

export async function renderWelcomeCard(data: WelcomeCardData, headers?: Record<string, string>) {
  const [background, avatar] = await Promise.all([loadImage(data.backgroundUrl), loadImage(data.avatarUrl)]);
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
            <div style={{ fontSize: 64, fontWeight: 700, textAlign: "center", textShadow }}>{data.title}</div>
          )}
          {data.subtitle && (
            <div style={{ fontSize: 34, textAlign: "center", opacity: 0.95, textShadow }}>{data.subtitle}</div>
          )}
        </div>
      </div>
    ),
    { ...WELCOME_CARD_SIZE, headers }
  );
}
