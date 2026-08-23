import Link from "next/link";
import { daysUntilReminder, formatReminderDate, listReminders } from "@hubbert/modules";
import { fetchGuildTextChannels } from "@hubbert/discord";
import { deleteReminderAction, toggleActiveAction } from "./actions";

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
      <div className="flex items-center justify-between">
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
        <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-2 font-medium">Título</th>
                <th className="px-4 py-2 font-medium">Fecha</th>
                <th className="px-4 py-2 font-medium">Anticipación</th>
                <th className="px-4 py-2 font-medium">Canal</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reminders.map((r) => {
                const remaining = daysUntilReminder(r.targetDate);
                return (
                  <tr key={r.id} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="px-4 py-2 text-zinc-900 dark:text-zinc-50">{r.title}</td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-300">
                      {formatReminderDate(r.targetDate)}
                      <span className="ml-1 text-xs text-zinc-400">({relativeLabel(remaining)})</span>
                    </td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-300">
                      {r.daysBefore} día{r.daysBefore === 1 ? "" : "s"} ·{" "}
                      {r.repeatMode === "daily" ? "diario" : "una vez"}
                    </td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-300">#{channelName(r.channelId)}</td>
                    <td className="px-4 py-2">
                      <form action={toggleActiveAction.bind(null, guildId, r.id)}>
                        <button
                          type="submit"
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            r.isActive
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                              : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          {r.isActive ? "Activo" : "Inactivo"}
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/servers/${guildId}/reminders/${r.id}`}
                          className="text-xs font-medium text-[#5865F2] hover:underline"
                        >
                          Editar
                        </Link>
                        <form action={deleteReminderAction.bind(null, guildId, r.id)}>
                          <button type="submit" className="text-xs text-red-600 hover:underline dark:text-red-400">
                            Eliminar
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
