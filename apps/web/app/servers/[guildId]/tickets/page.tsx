import Link from "next/link";
import { fetchAssignableRoles } from "@hubbert/discord";
import { countTicketsByStatus, listPanels, listTickets } from "@hubbert/modules";
import { CountBadge, LinkTabs } from "@/components/ui/settings";
import { closeTicketAction, deletePanelAction } from "./actions";

// Los cerrados son historial: se muestran los más recientes y el contador indica el total.
const CLOSED_LIMIT = 50;

function timeAgo(date: Date, now = Date.now()) {
  const minutes = Math.max(0, Math.round((now - date.getTime()) / 60_000));
  if (minutes < 1) return "recién";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} día${days === 1 ? "" : "s"}`;
}

function duration(from: Date, to: Date) {
  const minutes = Math.max(1, Math.round((to.getTime() - from.getTime()) / 60_000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.round(hours / 24);
  return `${days} día${days === 1 ? "" : "s"}`;
}

function Initial({ name, muted = false }: { name: string; muted?: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
        muted ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" : "bg-accent/10 text-accent"
      }`}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function SectionHeader({ title, count, tone, note }: { title: string; count: number; tone?: "ok"; note?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
        <CountBadge count={count} tone={tone} />
      </h3>
      {note && <span className="text-xs text-zinc-500 dark:text-zinc-400">{note}</span>}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
      {children}
    </p>
  );
}

const listClass = "rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950";
const rowClass = "flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-zinc-200 px-4 py-3 first:border-t-0 dark:border-zinc-800";

export default async function TicketsPage({
  params,
  searchParams,
}: {
  params: Promise<{ guildId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { guildId } = await params;
  const tab = (await searchParams).tab === "tickets" ? "tickets" : "paneles";

  const [panels, openTickets, closedTickets, counts, roles] = await Promise.all([
    listPanels(guildId),
    listTickets(guildId, "open"),
    listTickets(guildId, "closed", CLOSED_LIMIT),
    countTicketsByStatus(guildId),
    fetchAssignableRoles(guildId).catch(() => []),
  ]);
  const roleName = new Map(roles.map((r) => [r.id, `@${r.name}`]));
  const roleList = (ids: string[], empty: string) =>
    ids.length ? ids.map((id) => roleName.get(id) ?? "@rol-borrado").join(", ") : empty;

  const base = `/servers/${guildId}/tickets`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Tickets</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Canales privados de soporte que los miembros abren desde un panel.
          </p>
        </div>
        {tab === "paneles" && (
          <Link
            href={`${base}/new`}
            className="w-fit rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-strong"
          >
            + Nuevo panel
          </Link>
        )}
      </div>

      <LinkTabs
        active={tab}
        tabs={[
          { id: "paneles", label: "Paneles", href: base, badge: <CountBadge count={panels.length} /> },
          {
            id: "tickets",
            label: "Tickets",
            href: `${base}?tab=tickets`,
            badge: <CountBadge count={counts.open} tone="ok" />,
          },
        ]}
      />

      {tab === "paneles" && (
        <>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Un panel es un mensaje con botón que cualquiera puede clickear para abrir un ticket.
          </p>
          {panels.length === 0 ? (
            <Empty>Todavía no publicaste ningún panel.</Empty>
          ) : (
            <ul className={listClass}>
              {panels.map((p) => (
                <li key={p.id} className={rowClass}>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {p.title}
                      <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] font-normal text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {p.buttonEmoji} {p.buttonLabel}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      Atienden: {roleList(p.staffRoleIds, "solo admins")} · Pueden abrir:{" "}
                      {roleList(p.requiredRoleIds, "todos")} · Publicado el {p.createdAt.toLocaleDateString("es-CL")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`${base}/${p.id}`}
                      className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                    >
                      Editar
                    </Link>
                    <form action={deletePanelAction.bind(null, guildId, p.id)}>
                      <button
                        type="submit"
                        className="rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-red-500/10 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
                      >
                        Eliminar
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {tab === "tickets" && (
        <>
          <section className="flex flex-col gap-3">
            <SectionHeader title="Abiertos" count={counts.open} tone="ok" />
            {openTickets.length === 0 ? (
              <Empty>No hay tickets abiertos. 🎉</Empty>
            ) : (
              <ul className={listClass}>
                {openTickets.map((t) => (
                  <li key={t.id} className={rowClass}>
                    <Initial name={t.displayName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{t.displayName}</p>
                      <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {t.panel?.title ?? "Panel eliminado"} · abierto {timeAgo(t.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <a
                        href={`https://discord.com/channels/${guildId}/${t.channelId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md px-2 py-1 text-xs font-medium text-accent hover:bg-accent/10"
                      >
                        Ir al canal ↗
                      </a>
                      <form action={closeTicketAction.bind(null, guildId, t.channelId)}>
                        <button
                          type="submit"
                          className="rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-red-500/10 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
                        >
                          Cerrar
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <SectionHeader
              title="Cerrados"
              count={counts.closed}
              note={counts.closed > CLOSED_LIMIT ? `Mostrando los ${CLOSED_LIMIT} más recientes` : undefined}
            />
            {closedTickets.length === 0 ? (
              <Empty>Todavía no se cerró ningún ticket.</Empty>
            ) : (
              <ul className={listClass}>
                {closedTickets.map((t) => (
                  <li key={t.id} className={rowClass}>
                    <Initial name={t.displayName} muted />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-zinc-700 dark:text-zinc-300">{t.displayName}</p>
                      <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {t.panel?.title ?? "Panel eliminado"} · abierto el {t.createdAt.toLocaleDateString("es-CL")}
                      </p>
                    </div>
                    {t.closedAt && (
                      <div className="text-right text-xs text-zinc-500 dark:text-zinc-400">
                        <p>Cerrado {timeAgo(t.closedAt)}</p>
                        <p className="text-zinc-400 dark:text-zinc-500">Duró {duration(t.createdAt, t.closedAt)}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
