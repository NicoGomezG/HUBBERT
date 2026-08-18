export const TICKET_WELCOME_DEFAULT = "Gracias por escribir, {nombre}. Un miembro del staff te va a responder acá.";

export const TICKET_MESSAGE_VARIABLES = [
  { token: "{usuario}", description: "Menciona a quien abrió el ticket (le llega notificación)" },
  { token: "{nombre}", description: "Nombre visible, sin mención" },
] as const;

export interface TicketWelcomeMessageData {
  discordUserId: string;
  displayName: string;
}

export function renderTicketWelcomeMessage(template: string, data: TicketWelcomeMessageData): string {
  return template.replaceAll("{usuario}", `<@${data.discordUserId}>`).replaceAll("{nombre}", data.displayName);
}
