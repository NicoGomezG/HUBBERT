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
