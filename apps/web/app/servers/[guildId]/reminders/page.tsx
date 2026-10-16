import Link from "next/link";
import { daysUntilReminder, listReminders } from "@hubbert/modules";
import { fetchGuildTextChannels } from "@hubbert/discord";
import { deleteReminderAction, toggleActiveAction } from "./actions";
import { ListCard, ListRow } from "@/components/ui/ListRow";

function relativeLabel(remaining: number): string {
  if (remaining < 0) return "Vencido";
  if (remaining === 0) return "Hoy";
  if (remaining === 1) return "Mañana";
  return `En ${remaining} días`;
}

export default async function RemindersPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const [reminders, channels] = await Promise.all([
    listReminders(guildId),
    fetchGuildTextChannels(guildId),
  ]);
  const channelName = (id: string | null) =>
    id ? (channels.find((c) => c.id === id)?.name ?? "canal eliminado") : "por defecto";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Recordatorios</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Avisos con anticipación configurable para lo que quieras, más allá de los cumpleaños.
          </p>
        </div>
        <Link
          href={`/servers/${guildId}/reminders/new`}
          className="rounded-md bg-[#5865F2] px-3 py-2 text-sm font-medium text-white hover:bg-[#4752C4]"
        >
          + Nuevo recordatorio
        </Link>
      </div>

      {reminders.length === 0 && (
        <p className="rounded-md border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Todavía no registraste ningún recordatorio.
        </p>
      )}

      {reminders.length > 0 && (
        <ListCard>
          {reminders.map((r) => (
            <ListRow
              key={r.id}
              day={r.targetDate.getUTCDate()}
              month={r.targetDate.getUTCMonth() + 1}
              title={r.title}
              meta={`${relativeLabel(daysUntilReminder(r.targetDate))} · ${r.daysBefore} día${r.daysBefore === 1 ? "" : "s"} antes, ${r.repeatMode === "daily" ? "diario" : "una vez"} · #${channelName(r.channelId)}`}
              isActive={r.isActive}
              toggleAction={toggleActiveAction.bind(null, guildId, r.id)}
              deleteAction={deleteReminderAction.bind(null, guildId, r.id)}
              editHref={`/servers/${guildId}/reminders/${r.id}`}
            />
          ))}
        </ListCard>
      )}
    </div>
  );
}
