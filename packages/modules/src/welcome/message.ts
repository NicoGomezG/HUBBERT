// Sin imports a propósito: lo usan también los componentes de cliente (vía
// @hubbert/modules/client) para la vista previa.

export const WELCOME_TITLE_DEFAULT = "👋 ¡Nuevo miembro!";
export const WELCOME_MESSAGE_DEFAULT = "¡Bienvenido/a {usuario} a **{servidor}**! Eres el miembro número {miembros}. 🎉";
export const GOODBYE_MESSAGE_DEFAULT = "¡Gracias por haber pasado por **{servidor}**, {nombre}! Ojalá nos volvamos a ver.";

export const WELCOME_MESSAGE_VARIABLES = [
  { token: "{usuario}", description: "Menciona al nuevo miembro" },
  { token: "{nombre}", description: "Nombre visible, sin mención" },
  { token: "{servidor}", description: "Nombre del servidor" },
  { token: "{miembros}", description: "Cantidad de miembros (incluido el nuevo)" },
] as const;

export const GOODBYE_MESSAGE_VARIABLES = [
  { token: "{nombre}", description: "Nombre de quien salió" },
  { token: "{servidor}", description: "Nombre del servidor que dejó" },
] as const;

export interface WelcomeMessageData {
  discordUserId: string;
  displayName: string;
  guildName: string;
  memberCount: number | null;
}

export function renderWelcomeMessage(template: string, data: WelcomeMessageData): string {
  return template
    .replaceAll("{usuario}", `<@${data.discordUserId}>`)
    .replaceAll("{nombre}", data.displayName)
    .replaceAll("{servidor}", data.guildName)
    .replaceAll("{miembros}", data.memberCount != null ? String(data.memberCount) : "?");
}

export const HUBBERT_LINKS = {
  dashboard: "https://hubbert.vercel.app",
  donations: "https://link.mercadopago.cl/hubbertbot",
  creatorDiscord: "https://discord.gg/uNkB2Z49EE",
} as const;

/**
 * Bloque fijo que va al final de cada despedida. El admin del servidor puede
 * editar el saludo, pero no quitar esto.
 */
export const HUBBERT_PROMO_FIELDS = [
  {
    name: "🤖 Usa Hubbert en tu servidor",
    value: `Es gratis y se configura desde el panel: ${HUBBERT_LINKS.dashboard}`,
    inline: false,
  },
  {
    name: "✨ Lo que puede hacer",
    value: [
      "• Embeds con nombre y avatar personalizados",
      "• Cumpleaños y recordatorios automáticos",
      "• Tickets de soporte separados por rol",
      "• Roles por reacción",
      "• Bienvenidas y despedidas",
    ].join("\n"),
    inline: false,
  },
  {
    name: "💜 Apoya el proyecto",
    value: `Con tus donaciones podemos seguir trabajando en más funciones: ${HUBBERT_LINKS.donations}`,
    inline: false,
  },
  {
    name: "🛠️ Discord de mi creador",
    value: `Únete para dejar ideas, reportar errores o pedir ayuda: ${HUBBERT_LINKS.creatorDiscord}`,
    inline: false,
  },
];

export const HUBBERT_PROMO_BUTTONS = [
  { label: "Abrir panel", url: HUBBERT_LINKS.dashboard, emoji: "🤖" },
  { label: "Donar", url: HUBBERT_LINKS.donations, emoji: "💜" },
  { label: "Discord del creador", url: HUBBERT_LINKS.creatorDiscord, emoji: "🛠️" },
];

export const CARD_TITLE_DEFAULT = "¡Bienvenido/a!";
export const CARD_SUBTITLE_DEFAULT = "{nombre} · Miembro #{miembros}";

// La tarjeta es una imagen: no hay menciones, así que {usuario} no aplica.
export const CARD_TEXT_VARIABLES = [
  { token: "{nombre}", description: "Nombre visible del nuevo miembro" },
  { token: "{servidor}", description: "Nombre del servidor" },
  { token: "{miembros}", description: "Cantidad de miembros" },
] as const;

export function renderCardText(
  template: string,
  data: { displayName: string; guildName: string; memberCount: number | null }
): string {
  return template
    .replaceAll("{nombre}", data.displayName)
    .replaceAll("{servidor}", data.guildName)
    .replaceAll("{miembros}", data.memberCount != null ? String(data.memberCount) : "?");
}

/**
 * Fuentes de Google Fonts para la tarjeta. `family` es el nombre exacto en
 * Google Fonts; los pesos son los que se piden para título y subtítulo (las
 * que tienen un solo peso usan 400 en ambos). `scale` achica el texto de las
 * fuentes muy anchas para que un título largo no se salga de la tarjeta.
 */
export const CARD_FONTS = [
  { value: "default", label: "Predeterminada", family: null, titleWeight: 700, subtitleWeight: 400 },
  { value: "poppins", label: "Poppins", family: "Poppins", titleWeight: 700, subtitleWeight: 400 },
  { value: "montserrat", label: "Montserrat", family: "Montserrat", titleWeight: 800, subtitleWeight: 500 },
  { value: "bebas", label: "Bebas Neue", family: "Bebas Neue", titleWeight: 400, subtitleWeight: 400 },
  { value: "anton", label: "Anton", family: "Anton", titleWeight: 400, subtitleWeight: 400 },
  { value: "righteous", label: "Righteous", family: "Righteous", titleWeight: 400, subtitleWeight: 400 },
  { value: "bangers", label: "Bangers (cómic)", family: "Bangers", titleWeight: 400, subtitleWeight: 400 },
  { value: "orbitron", label: "Orbitron (futurista)", family: "Orbitron", titleWeight: 800, subtitleWeight: 500 },
  {
    value: "press-start",
    label: "Press Start 2P (pixel)",
    family: "Press Start 2P",
    titleWeight: 400,
    subtitleWeight: 400,
    scale: 0.6,
  },
  { value: "pacifico", label: "Pacifico (manuscrita)", family: "Pacifico", titleWeight: 400, subtitleWeight: 400 },
  { value: "lobster", label: "Lobster", family: "Lobster", titleWeight: 400, subtitleWeight: 400 },
  { value: "dancing", label: "Dancing Script", family: "Dancing Script", titleWeight: 700, subtitleWeight: 500 },
  { value: "permanent-marker", label: "Permanent Marker (plumón)", family: "Permanent Marker", titleWeight: 400, subtitleWeight: 400 },
] as const;

export type CardFontValue = (typeof CARD_FONTS)[number]["value"];

export function findCardFont(value: string | null | undefined) {
  return CARD_FONTS.find((f) => f.value === value) ?? CARD_FONTS[0];
}
