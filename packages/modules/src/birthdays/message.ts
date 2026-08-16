export const BIRTHDAY_MESSAGE_VARIABLES = [
  { token: "{user}", description: "Menciona a la persona (le llega notificación)" },
  { token: "{nombre}", description: "Nombre visible, sin mención" },
  { token: "{servidor}", description: "Nombre del servidor" },
  { token: "{edad}", description: "Edad que cumple (vacío si no cargaste el año)" },
] as const;

export interface BirthdayMessageData {
  discordUserId: string;
  displayName: string;
  guildName: string;
  age: number | null;
}

export function renderBirthdayMessage(template: string, data: BirthdayMessageData): string {
  return template
    .replaceAll("{user}", `<@${data.discordUserId}>`)
    .replaceAll("{nombre}", data.displayName)
    .replaceAll("{servidor}", data.guildName)
    .replaceAll("{edad}", data.age != null ? String(data.age) : "");
}
