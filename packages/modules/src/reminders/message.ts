import { formatDateShort } from "./format";

export const REMINDER_MESSAGE_VARIABLES = [
  { token: "{titulo}", description: "Título del recordatorio" },
  { token: "{descripcion}", description: "Descripción/nota (vacío si no la cargaste)" },
  { token: "{dias}", description: "Días restantes (0 el día del evento)" },
  { token: "{fecha}", description: "Fecha del evento (DD/MM/AAAA)" },
  { token: "{servidor}", description: "Nombre del servidor" },
] as const;

export interface ReminderMessageData {
  title: string;
  description: string | null;
  daysRemaining: number;
  targetDate: Date;
  guildName: string;
}

export function renderReminderMessage(template: string, data: ReminderMessageData): string {
  return template
    .replaceAll("{titulo}", data.title)
    .replaceAll("{descripcion}", data.description ?? "")
    .replaceAll("{dias}", String(data.daysRemaining))
    .replaceAll("{fecha}", formatDateShort(data.targetDate))
    .replaceAll("{servidor}", data.guildName);
}

/** Mensaje por defecto cuando el recordatorio no tiene customMessage. */
export function defaultReminderTemplate(daysRemaining: number): string {
  if (daysRemaining <= 0) return "📌 ¡Hoy es el día! **{titulo}**";
  if (daysRemaining === 1) return "📌 Mañana: **{titulo}**";
  return "📌 En {dias} días: **{titulo}**";
}
