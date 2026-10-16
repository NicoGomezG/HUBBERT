"use client";

import Link from "next/link";
import { useState } from "react";
import { SubmitToggle } from "@/components/ui/SubmitToggle";
import { inputClass } from "@/components/ui/settings";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export interface BirthdayItem {
  id: string;
  displayName: string;
  day: number;
  month: number;
  year: number | null;
  channelLabel: string;
  isActive: boolean;
  toggleAction: () => Promise<void>;
  deleteAction: () => Promise<void>;
}

type Today = { day: number; month: number; year: number };

/** Año del próximo cumpleaños: este año si todavía no pasó (o es hoy), si no el siguiente. */
function nextBirthdayYear(b: { day: number; month: number }, today: Today) {
  const passed = b.month < today.month || (b.month === today.month && b.day < today.day);
  return passed ? today.year + 1 : today.year;
}

/** Días hasta el próximo cumpleaños (0 = hoy). */
function daysUntil(b: { day: number; month: number }, today: Today) {
  const next = Date.UTC(nextBirthdayYear(b, today), b.month - 1, b.day);
  return Math.round((next - Date.UTC(today.year, today.month - 1, today.day)) / 86_400_000);
}

function whenLabel(n: number) {
  if (n === 0) return "Hoy";
  if (n === 1) return "Mañana";
  return `En ${n} días`;
}

function Initial({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[11px] font-semibold text-accent"
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function Row({ b, guildId, today }: { b: BirthdayItem; guildId: string; today: { day: number; month: number; year: number } }) {
  const n = daysUntil(b, today);
  return (
    <li className="grid grid-cols-[2rem_minmax(0,1fr)_auto_auto] items-center gap-3 border-t border-zinc-200 py-2.5 pr-3 pl-4 first:border-t-0 sm:pl-9 dark:border-zinc-800">
      <span className={`text-center text-[15px] font-semibold tabular-nums ${b.isActive ? "" : "opacity-50"}`}>{b.day}</span>
      <div className={`flex min-w-0 items-center gap-2 ${b.isActive ? "" : "opacity-50"}`}>
        <Initial name={b.displayName} />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
            <span className="truncate">{b.displayName}</span>
            {n === 0 && (
              <span className="rounded-full bg-emerald-500/12 px-1.5 py-px text-[10.5px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                Hoy 🎂
              </span>
            )}
          </p>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            {whenLabel(n)}
            {b.year ? ` · cumple ${nextBirthdayYear(b, today) - b.year}` : ""} · #{b.channelLabel}
          </p>
        </div>
      </div>
      <form action={b.toggleAction} className="flex">
        <SubmitToggle checked={b.isActive} label={b.isActive ? `Desactivar ${b.displayName}` : `Activar ${b.displayName}`} />
      </form>
      <RowMenu editHref={`/servers/${guildId}/birthdays/${b.id}`} deleteAction={b.deleteAction} />
    </li>
  );
}

function RowMenu({ editHref, deleteAction }: { editHref: string; deleteAction: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Más acciones"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onBlur={(e) => {
          if (!e.currentTarget.parentElement?.contains(e.relatedTarget)) setOpen(false);
        }}
        className="rounded-md px-1.5 py-0.5 text-base leading-none text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
      >
        ⋯
      </button>
      {open && (
        <div className="animate-fade-in absolute top-full right-0 z-20 mt-1 flex w-32 flex-col rounded-lg border border-zinc-200 bg-white p-1 shadow-lg shadow-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/40">
          <Link
            href={editHref}
            className="rounded-md px-2 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Editar
          </Link>
          <form action={deleteAction}>
            <button
              type="submit"
              className="w-full rounded-md px-2 py-1.5 text-left text-sm text-red-600 hover:bg-red-500/10 dark:text-red-400"
            >
              Eliminar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

/** Lista de cumpleaños agrupada por mes, empezando por el mes actual. */
export function BirthdayMonths({
  guildId,
  birthdays,
  today,
}: {
  guildId: string;
  birthdays: BirthdayItem[];
  today: { day: number; month: number; year: number };
}) {
  const [query, setQuery] = useState("");
  // Meses abiertos/cerrados por el usuario; si no tocó uno, se abre el actual y el siguiente.
  const [toggled, setToggled] = useState<Record<number, boolean>>({});

  const q = query.trim().toLowerCase();
  const months = Array.from({ length: 12 }, (_, i) => ((today.month - 1 + i) % 12) + 1);

  return (
    <div className="flex flex-col gap-3">
      <input
        className={inputClass}
        placeholder="Buscar por nombre…"
        aria-label="Buscar cumpleaños"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        {months.map((m, index) => {
          const list = birthdays
            .filter((b) => b.month === m && (!q || b.displayName.toLowerCase().includes(q)))
            .sort((a, b) => a.day - b.day);
          const empty = list.length === 0;
          const open = !empty && (q ? true : (toggled[m] ?? index <= 1));
          return (
            <section key={m} className="border-t border-zinc-200 first:border-t-0 dark:border-zinc-800">
              <button
                type="button"
                disabled={empty}
                aria-expanded={open}
                onClick={() => setToggled((t) => ({ ...t, [m]: !open }))}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left disabled:cursor-default"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                  className={`h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform duration-200 ${open ? "rotate-90" : ""} ${empty ? "invisible" : ""}`}
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
                <span
                  className={`text-sm font-semibold ${empty ? "text-zinc-400 dark:text-zinc-600" : "text-zinc-900 dark:text-zinc-50"}`}
                >
                  {MONTHS[m - 1]}
                </span>
                {m === today.month && (
                  <span className="rounded-full bg-accent/10 px-1.5 py-px text-[10.5px] font-medium text-accent">
                    Este mes
                  </span>
                )}
                <span className="ml-auto flex items-center gap-2.5">
                  {!empty && (
                    <span className="flex">
                      {list.slice(0, 4).map((b) => (
                        <span
                          key={b.id}
                          aria-hidden
                          className="-ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 text-[9px] font-semibold text-zinc-600 ring-2 ring-white first:ml-0 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-950"
                        >
                          {b.displayName.slice(0, 1).toUpperCase()}
                        </span>
                      ))}
                    </span>
                  )}
                  <span className="w-5 text-right text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
                    {empty ? "—" : list.length}
                  </span>
                </span>
              </button>
              {open && (
                <ul className="border-t border-zinc-200 bg-zinc-50/60 dark:border-zinc-800 dark:bg-black/20">
                  {list.map((b) => (
                    <Row key={b.id} b={b} guildId={guildId} today={today} />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
