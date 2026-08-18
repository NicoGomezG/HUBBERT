const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

export interface BirthdayListItem {
  day: number;
  month: number;
  displayName: string;
}

export function formatBirthdayLine(b: BirthdayListItem): string {
  return `• **${String(b.day).padStart(2, "0")}** — ${b.displayName}`;
}

export function formatBirthdayList(birthdays: BirthdayListItem[]): string {
  if (!birthdays.length) return "Todavía no hay cumpleaños registrados en este servidor.";

  const byMonth = new Map<number, BirthdayListItem[]>();
  for (const b of birthdays) {
    if (!byMonth.has(b.month)) byMonth.set(b.month, []);
    byMonth.get(b.month)!.push(b);
  }

  const parts: string[] = [];
  for (let month = 1; month <= 12; month++) {
    const items = byMonth.get(month);
    if (!items) continue;
    parts.push(`**${MONTH_NAMES[month - 1]}**\n${items.map(formatBirthdayLine).join("\n")}`);
  }

  return parts.join("\n\n");
}

export function monthName(month: number): string {
  return MONTH_NAMES[month - 1];
}
