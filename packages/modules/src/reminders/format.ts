export interface ReminderListItem {
  id: string;
  title: string;
  targetDate: Date;
}

/** Días restantes hasta targetDate, comparando fechas UTC puras (sin horas). */
export function daysUntil(targetDate: Date, now: Date = new Date()): number {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const target = Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate());
  return Math.round((target - today) / 86_400_000);
}

export function formatDateShort(d: Date): string {
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getUTCFullYear()}`;
}

function relativeLabel(remaining: number): string {
  if (remaining < 0) return "vencido";
  if (remaining === 0) return "hoy";
  if (remaining === 1) return "mañana";
  return `en ${remaining} días`;
}

export function formatReminderLine(r: ReminderListItem, now: Date = new Date()): string {
  const remaining = daysUntil(r.targetDate, now);
  return `• **${r.title}** — ${formatDateShort(r.targetDate)} (${relativeLabel(remaining)})`;
}

export function formatReminderList(reminders: ReminderListItem[], now: Date = new Date()): string {
  if (!reminders.length) return "Todavía no hay recordatorios registrados en este servidor.";
  return reminders.map((r) => formatReminderLine(r, now)).join("\n");
}
