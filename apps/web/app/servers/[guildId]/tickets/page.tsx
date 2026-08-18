import Link from "next/link";
import { listPanels, listTickets } from "@hubbert/modules";
import { closeTicketAction, deletePanelAction } from "./actions";

export default async function TicketsPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const [panels, tickets] = await Promise.all([listPanels(guildId), listTickets(guildId)]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Paneles</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Un panel es un mensaje con botón que cualquiera puede clickear para abrir un ticket.
            </p>
          </div>
          <Link
            href={`/servers/${guildId}/tickets/new`}
            className="rounded-md bg-[#5865F2] px-3 py-2 text-sm font-medium text-white hover:bg-[#4752C4]"
          >
            + Nuevo panel
          </Link>
        </div>

        {panels.length === 0 && (
          <p className="mt-4 rounded-md border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            Todavía no publicaste ningún panel.
          </p>
        )}

        {panels.length > 0 && (
          <div className="mt-4 overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-2 font-medium">Título</th>
                  <th className="px-4 py-2 font-medium">Botón</th>
                  <th className="px-4 py-2 font-medium">Publicado</th>
                  <th className="px-4 py-2 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {panels.map((p) => (
                  <tr key={p.id} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="px-4 py-2 text-zinc-900 dark:text-zinc-50">{p.title}</td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-300">{p.buttonLabel}</td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-300">
                      {p.createdAt.toLocaleDateString("es-CL")}
                    </td>
                    <td className="px-4 py-2">
                      <form action={deletePanelAction.bind(null, guildId, p.id)}>
                        <button type="submit" className="text-xs text-red-600 hover:underline dark:text-red-400">
                          Eliminar
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Tickets</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Últimos tickets abiertos en este servidor. La conversación queda en el canal de Discord — acá solo se
          muestra el estado.
        </p>

        {tickets.length === 0 && (
          <p className="mt-4 rounded-md border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            Todavía no se abrió ningún ticket.
          </p>
        )}

        {tickets.length > 0 && (
          <div className="mt-4 overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-2 font-medium">Usuario</th>
                  <th className="px-4 py-2 font-medium">Panel</th>
                  <th className="px-4 py-2 font-medium">Estado</th>
                  <th className="px-4 py-2 font-medium">Abierto</th>
                  <th className="px-4 py-2 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="px-4 py-2 text-zinc-900 dark:text-zinc-50">{t.displayName}</td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-300">{t.panel?.title ?? "—"}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          t.status === "open"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                            : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}
                      >
                        {t.status === "open" ? "Abierto" : "Cerrado"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-zinc-600 dark:text-zinc-300">
                      {t.createdAt.toLocaleDateString("es-CL")}
                    </td>
                    <td className="px-4 py-2">
                      {t.status === "open" ? (
                        <div className="flex items-center gap-3">
                          <a
                            href={`https://discord.com/channels/${guildId}/${t.channelId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-medium text-[#5865F2] hover:underline"
                          >
                            Ir al canal
                          </a>
                          <form action={closeTicketAction.bind(null, guildId, t.channelId)}>
                            <button type="submit" className="text-xs text-red-600 hover:underline dark:text-red-400">
                              Cerrar
                            </button>
                          </form>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400 dark:text-zinc-600">
                          {t.closedAt ? t.closedAt.toLocaleDateString("es-CL") : ""}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
