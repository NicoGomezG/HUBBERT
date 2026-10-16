import Link from "next/link";
import { SubmitToggle } from "./SubmitToggle";

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** Fila de lista con bloque de fecha, toggle de activo y acciones (editar / eliminar). */
export function ListRow({
  day,
  month,
  title,
  meta,
  isActive,
  toggleAction,
  deleteAction,
  editHref,
}: {
  day: number;
  /** 1–12 */
  month: number;
  title: string;
  meta: React.ReactNode;
  isActive: boolean;
  toggleAction: () => Promise<void>;
  deleteAction: () => Promise<void>;
  editHref: string;
}) {
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-t border-zinc-200 px-4 py-3 first:border-t-0 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] dark:border-zinc-800">
      <div
        className={`w-11 rounded-lg border border-zinc-200 py-1 text-center tabular-nums dark:border-zinc-800 ${isActive ? "" : "opacity-50"}`}
      >
        <span className="block font-mono text-[9px] tracking-widest text-accent uppercase">{MONTHS[month - 1]}</span>
        <span className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{day}</span>
      </div>
      <div className={`min-w-0 ${isActive ? "" : "opacity-50"}`}>
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{title}</p>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{meta}</p>
      </div>
      <form action={toggleAction} className="flex">
        <SubmitToggle checked={isActive} label={isActive ? `Desactivar ${title}` : `Activar ${title}`} />
      </form>
      <div className="col-start-2 flex items-center gap-1 sm:col-start-auto">
        <Link
          href={editHref}
          className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
        >
          Editar
        </Link>
        <form action={deleteAction}>
          <button
            type="submit"
            className="rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-red-500/10 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
          >
            Eliminar
          </button>
        </form>
      </div>
    </li>
  );
}

export function ListCard({ children }: { children: React.ReactNode }) {
  return (
    <ul className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">{children}</ul>
  );
}
