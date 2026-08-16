import Link from "next/link";
import { listBirthdays } from "@hubbert/modules";
import { fetchGuildTextChannels } from "@hubbert/discord";
import { deleteBirthdayAction, toggleActiveAction } from "./actions";

const MONTHS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

export default async function BirthdaysPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const [birthdays, channels] = await Promise.all([
    listBirthdays(guildId),
    fetchGuildTextChannels(guildId),
  ]);
  const channelName = (id: string | null) =>
    id ? (channels.find((c) => c.id === id)?.name ?? "canal eliminado") : "por defecto";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Cumpleaños</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Se felicitan automáticamente el día que corresponde.
          </p>
        </div>
        <Link
          href={`/servers/${guildId}/birthdays/new`}
          className="rounded-md bg-[#5865F2] px-3 py-2 text-sm font-medium text-white hover:bg-[#4752C4]"
        >
          + Nuevo cumpleaños
        </Link>
      </div>

      {birthdays.length === 0 && (
        <p className="rounded-md border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Todavía no registraste ningún cumpleaños.
        </p>
      )}

      {birthdays.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-2 font-medium">Usuario</th>
                <th className="px-4 py-2 font-medium">Fecha</th>
                <th className="px-4 py-2 font-medium">Canal</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {birthdays.map((b) => (
                <tr key={b.id} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="px-4 py-2 text-zinc-900 dark:text-zinc-50">{b.displayName}</td>
                  <td className="px-4 py-2 text-zinc-600 dark:text-zinc-300">
                    {b.day} {MONTHS[b.month - 1]}
                    {b.year ? ` ${b.year}` : ""}
                  </td>
                  <td className="px-4 py-2 text-zinc-600 dark:text-zinc-300">
                    #{channelName(b.channelId)}
                  </td>
                  <td className="px-4 py-2">
                    <form action={toggleActiveAction.bind(null, guildId, b.id)}>
                      <button
                        type="submit"
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          b.isActive
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                            : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}
                      >
                        {b.isActive ? "Activo" : "Inactivo"}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/servers/${guildId}/birthdays/${b.id}`}
                        className="text-xs font-medium text-[#5865F2] hover:underline"
                      >
                        Editar
                      </Link>
                      <form action={deleteBirthdayAction.bind(null, guildId, b.id)}>
                        <button
                          type="submit"
                          className="text-xs text-red-600 hover:underline dark:text-red-400"
                        >
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
