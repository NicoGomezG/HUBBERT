import Link from "next/link";
import { ACTIVE_BROADCAST_STATUSES, listBroadcasts } from "@hubbert/modules";
import { AutoRefresh } from "@/components/broadcasts/AutoRefresh";
import { cancelBroadcastAction } from "./actions";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "En cola", className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300" },
  sending: { label: "Enviando", className: "bg-accent/10 text-accent" },
  done: {
    label: "Terminado",
    className: "bg-emerald-500/12 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  cancelled: { label: "Cancelado", className: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" },
};

export default async function BroadcastsPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const broadcasts = await listBroadcasts(guildId);
  const anyActive = broadcasts.some((b) => ACTIVE_BROADCAST_STATUSES.includes(b.status));

  return (
    <div className="flex flex-col gap-4">
      <AutoRefresh active={anyActive} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Mensajes masivos</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Manda un embed por mensaje directo a todos los miembros con un rol. Los mensajes salen de a uno, con
            pausas, para que Discord no marque al bot como spam.
          </p>
        </div>
        <Link
          href={`/servers/${guildId}/masivos/new`}
          className="shrink-0 rounded-md bg-[#5865F2] px-3 py-2 text-sm font-medium text-white hover:bg-[#4752C4]"
        >
          + Nuevo envío
        </Link>
      </div>

      {broadcasts.length === 0 && (
        <p className="rounded-md border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Todavía no hiciste ningún envío masivo.
        </p>
      )}

      {broadcasts.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-2 font-medium">Embed</th>
                <th className="px-4 py-2 font-medium">Roles</th>
                <th className="px-4 py-2 font-medium">Progreso</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium">Creado</th>
                <th className="px-4 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {broadcasts.map((b) => {
                const done = b.counts.sent + b.counts.closed + b.counts.failed;
                const status = STATUS_LABELS[b.status] ?? STATUS_LABELS.pending;
                const active = ACTIVE_BROADCAST_STATUSES.includes(b.status);
                return (
                  <tr key={b.id} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="px-4 py-2 text-zinc-900 dark:text-zinc-50">{b.embedName}</td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-300">
                      {b.roleNames.map((n) => `@${n}`).join(", ")}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex min-w-40 flex-col gap-1">
                        <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                          <div
                            className="h-full rounded-full bg-accent transition-all"
                            style={{ width: `${b.total ? (done / b.total) * 100 : 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
                          {b.counts.sent}/{b.total} entregados
                          {b.counts.closed > 0 && ` · ${b.counts.closed} con DMs cerrados`}
                          {b.counts.failed > 0 && ` · ${b.counts.failed} con error`}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-px text-[11px] font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-300">
                      {b.createdAt.toLocaleDateString("es-CL")}
                    </td>
                    <td className="px-4 py-2">
                      {active && (
                        <form action={cancelBroadcastAction.bind(null, guildId, b.id)}>
                          <button type="submit" className="text-xs text-red-600 hover:underline dark:text-red-400">
                            Cancelar
                          </button>
                        </form>
                      )}
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
