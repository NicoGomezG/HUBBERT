"use client";

import { useState } from "react";
import { inputClass } from "./settings";

export interface PickerRole {
  id: string;
  name: string;
  color: number;
}

/** Selección múltiple de roles como chips, con buscador. */
export function RolePicker({
  roles,
  selected,
  onChange,
}: {
  roles: PickerRole[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((r) => r !== id) : [...selected, id]);
  }

  if (roles.length === 0) {
    return <p className="text-xs text-zinc-500 dark:text-zinc-400">Cargando roles…</p>;
  }

  const q = query.trim().toLowerCase();
  const visible = q ? roles.filter((r) => r.name.toLowerCase().includes(q)) : roles;

  return (
    <div className="flex flex-col gap-2">
      {roles.length > 8 && (
        <input
          className={inputClass}
          placeholder="Buscar rol…"
          aria-label="Buscar rol"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}
      <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto">
        {visible.map((role) => {
          const on = selected.includes(role.id);
          return (
            <button
              key={role.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(role.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                on
                  ? "border-accent bg-accent/10 text-zinc-900 dark:text-zinc-50"
                  : "border-zinc-300 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600"
              }`}
            >
              <span
                aria-hidden
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: role.color ? `#${role.color.toString(16).padStart(6, "0")}` : "#99aab5" }}
              />
              @{role.name}
              {on && (
                <span aria-hidden className="text-accent">
                  ✓
                </span>
              )}
            </button>
          );
        })}
        {visible.length === 0 && <p className="text-xs text-zinc-500 dark:text-zinc-400">Ningún rol coincide.</p>}
      </div>
    </div>
  );
}
