// Piezas compartidas de los formularios del panel: toggle, filas de ajuste, cards y sub-tabs.
// Sin "use client": se pueden renderizar tanto desde server como desde client components.

import Link from "next/link";

export function Toggle({
  checked,
  onChange,
  label,
  size = "md",
  disabled = false,
  type = "button",
}: {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  /** Texto para lectores de pantalla. */
  label: string;
  size?: "sm" | "md";
  disabled?: boolean;
  /** "submit" para usarlo dentro de un <form action> sin JS propio. */
  type?: "button" | "submit";
}) {
  const track = size === "sm" ? "h-[18px] w-8" : "h-5 w-9";
  const knob = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const shift = size === "sm" ? "translate-x-3.5" : "translate-x-4";
  return (
    <button
      type={type}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange ? () => onChange(!checked) : undefined}
      className={`relative inline-flex shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${track} ${
        checked ? "bg-accent" : "bg-zinc-300 dark:bg-zinc-700"
      }`}
    >
      <span
        aria-hidden
        className={`rounded-full bg-white shadow-sm shadow-black/25 transition-transform duration-200 motion-reduce:transition-none ${knob} ${
          checked ? shift : "translate-x-0"
        }`}
      />
    </button>
  );
}

/** Fila con título + descripción a la izquierda y un control (normalmente un Toggle) a la derecha. */
export function SettingRow({
  title,
  description,
  dimmed = false,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  dimmed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center gap-4 border-t border-zinc-200 px-4 py-3 first:border-t-0 dark:border-zinc-800 ${
        dimmed ? "opacity-50" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{title}</p>
        {description && <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>}
      </div>
      {children}
    </div>
  );
}

/** Card de grupo. `disabled` atenúa el cuerpo cuando el módulo del que depende está apagado. */
export function SettingsCard({
  title,
  description,
  action,
  disabled = false,
  flush = false,
  children,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Control a la derecha del encabezado (p. ej. un Toggle). */
  action?: React.ReactNode;
  disabled?: boolean;
  /** Sin padding interno, para listas de SettingRow. */
  flush?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {title && (
        <header
          className={`flex items-center gap-4 px-4 py-3.5 ${children ? "border-b border-zinc-200 dark:border-zinc-800" : ""}`}
        >
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
            {description && <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children && (
        <div
          className={`${flush ? "" : "flex flex-col gap-4 p-4"} transition-opacity ${
            disabled ? "pointer-events-none opacity-45" : ""
          }`}
          aria-disabled={disabled || undefined}
        >
          {children}
        </div>
      )}
    </section>
  );
}

/** Card grande con el toggle principal de un módulo. */
export function ModuleToggle({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} label={title} />
    </div>
  );
}

export function StatusPill({ on, onLabel = "Activa", offLabel = "Apagada" }: { on: boolean; onLabel?: string; offLabel?: string }) {
  return (
    <span
      className={`rounded-full px-2 py-px text-[11px] font-medium ${
        on
          ? "bg-emerald-500/12 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
      }`}
    >
      {on ? onLabel : offLabel}
    </span>
  );
}

export function SubTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; badge?: React.ReactNode }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={tabClass(selected)}
          >
            {tab.label}
            {tab.badge}
          </button>
        );
      })}
    </div>
  );
}

const tabClass = (selected: boolean) =>
  `-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm whitespace-nowrap transition-colors ${
    selected
      ? "border-accent font-medium text-zinc-900 dark:text-zinc-50"
      : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
  }`;

/** Igual que SubTabs, pero cada tab es un link (la tab activa vive en la URL). Sirve en server components. */
export function LinkTabs({
  tabs,
  active,
}: {
  tabs: { id: string; label: string; href: string; badge?: React.ReactNode }[];
  active: string;
}) {
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          scroll={false}
          aria-current={tab.id === active ? "page" : undefined}
          className={tabClass(tab.id === active)}
        >
          {tab.label}
          {tab.badge}
        </Link>
      ))}
    </nav>
  );
}

export function CountBadge({ count, tone = "neutral" }: { count: number; tone?: "neutral" | "ok" }) {
  return (
    <span
      className={`rounded-full px-2 py-px text-[11px] font-medium tabular-nums ${
        tone === "ok" && count > 0
          ? "bg-emerald-500/12 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
      }`}
    >
      {count}
    </span>
  );
}

/** Barra fija abajo con el estado de guardado y las acciones del formulario. */
export function SaveBar({
  dirty,
  message,
  children,
}: {
  dirty: boolean;
  message?: { kind: "ok" | "error"; text: string } | null;
  children: React.ReactNode;
}) {
  // Un "guardado" viejo no debe tapar cambios nuevos.
  const shown = message && !(dirty && message.kind === "ok") ? message : null;
  const text = shown?.text ?? (dirty ? "Tienes cambios sin guardar" : "Todo guardado");
  const tone =
    shown?.kind === "error"
      ? "text-red-400 dark:text-red-600"
      : shown?.kind === "ok"
        ? "text-emerald-400 dark:text-emerald-700"
        : "";
  return (
    <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-zinc-900 py-2.5 pr-3 pl-4 text-zinc-50 shadow-xl shadow-zinc-900/20 dark:bg-zinc-50 dark:text-zinc-900 dark:shadow-black/40">
      <p className={`text-sm ${tone}`} role="status">
        {text}
      </p>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-accent focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
export const labelClass = "text-xs font-medium text-zinc-600 dark:text-zinc-400";
