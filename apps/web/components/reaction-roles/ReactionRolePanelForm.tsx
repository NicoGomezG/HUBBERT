"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { REACTION_ROLE_MAX_OPTIONS, REACTION_ROLE_MODES } from "@hubbert/modules";

interface Channel {
  id: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
  color: number;
  assignable: boolean;
}

interface GuildEmoji {
  id: string;
  name: string;
  display: string;
  imageUrl: string;
}

interface OptionRow {
  emoji: string;
  roleId: string;
  label: string;
}

type Mode = (typeof REACTION_ROLE_MODES)[number]["value"];

const EMPTY_ROW: OptionRow = { emoji: "", roleId: "", label: "" };

export function ReactionRolePanelForm({ guildId }: { guildId: string }) {
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [emojis, setEmojis] = useState<GuildEmoji[]>([]);
  const [title, setTitle] = useState("Elige tus roles");
  const [description, setDescription] = useState("Reacciona con el emoji del rol que quieres.");
  const [color, setColor] = useState("#5865f2");
  const [mode, setMode] = useState<Mode>("multiple");
  const [options, setOptions] = useState<OptionRow[]>([{ ...EMPTY_ROW }]);
  const [activeRow, setActiveRow] = useState(0);
  const [channelId, setChannelId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = <T,>(path: string, set: (data: T) => void) =>
      fetch(`/api/guilds/${guildId}/${path}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success) set(json.data);
        })
        .catch(() => {});

    load<Channel[]>("channels", setChannels);
    load<Role[]>("roles", setRoles);
    load<GuildEmoji[]>("emojis", setEmojis);
  }, [guildId]);

  function updateRow(index: number, patch: Partial<OptionRow>) {
    setOptions((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setOptions((rows) => [...rows, { ...EMPTY_ROW }]);
    setActiveRow(options.length);
  }

  function removeRow(index: number) {
    setOptions((rows) => rows.filter((_, i) => i !== index));
    setActiveRow(0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/guilds/${guildId}/reaction-roles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || null,
        color: parseInt(color.replace("#", ""), 16),
        mode,
        channelId,
        options: options.map((o) => ({ emoji: o.emoji, roleId: o.roleId, label: o.label || null })),
      }),
    });
    const json = await res.json();
    setSaving(false);

    if (!json.success) {
      setError(json.error.message);
      return;
    }

    router.push(`/servers/${guildId}/roles`);
    router.refresh();
  }

  const inputClass =
    "w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-[#5865F2] focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
  const labelClass = "text-xs font-medium text-zinc-600 dark:text-zinc-400";

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className={labelClass}>Título</label>
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass}>Descripción</label>
        <textarea
          className={inputClass}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Debajo de la descripción se agrega automáticamente la lista de emojis con su rol.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass}>Color del panel</label>
        <input
          type="color"
          className="h-9 w-full max-w-md rounded-md border border-zinc-300 dark:border-zinc-700"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass}>Modo</label>
        <div className="grid gap-2 sm:grid-cols-2">
          {REACTION_ROLE_MODES.map((m) => (
            <label
              key={m.value}
              className={`flex cursor-pointer flex-col gap-0.5 rounded-md border px-3 py-2 text-sm ${
                mode === m.value
                  ? "border-[#5865F2] bg-[#5865F2]/5"
                  : "border-zinc-300 dark:border-zinc-700"
              }`}
            >
              <span className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-50">
                <input
                  type="radio"
                  name="mode"
                  value={m.value}
                  checked={mode === m.value}
                  onChange={() => setMode(m.value)}
                />
                {m.label}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{m.description}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className={labelClass}>
          Emojis y roles ({options.length}/{REACTION_ROLE_MAX_OPTIONS})
        </label>

        {options.map((row, index) => (
          <div key={index} className="grid grid-cols-[5rem_1fr_1fr_auto] items-center gap-2">
            <input
              className={`${inputClass} text-center`}
              placeholder="🎮"
              value={row.emoji}
              onFocus={() => setActiveRow(index)}
              onChange={(e) => updateRow(index, { emoji: e.target.value })}
              required
            />
            <select
              className={inputClass}
              value={row.roleId}
              onFocus={() => setActiveRow(index)}
              onChange={(e) => updateRow(index, { roleId: e.target.value })}
              required
            >
              <option value="">Elegir rol…</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id} disabled={!r.assignable}>
                  @{r.name}
                  {r.assignable ? "" : " (por encima del bot)"}
                </option>
              ))}
            </select>
            <input
              className={inputClass}
              placeholder="Texto opcional"
              value={row.label}
              maxLength={100}
              onFocus={() => setActiveRow(index)}
              onChange={(e) => updateRow(index, { label: e.target.value })}
            />
            <button
              type="button"
              onClick={() => removeRow(index)}
              disabled={options.length === 1}
              className="px-2 text-sm text-red-600 hover:underline disabled:opacity-30 dark:text-red-400"
              aria-label="Quitar"
            >
              ✕
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addRow}
          disabled={options.length >= REACTION_ROLE_MAX_OPTIONS}
          className="w-fit text-sm font-medium text-[#5865F2] hover:underline disabled:opacity-50"
        >
          + Agregar emoji
        </button>

        {emojis.length > 0 && (
          <div className="flex flex-col gap-1">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Emojis de este servidor — haz clic para usarlo en la fila seleccionada:
            </p>
            <div className="flex flex-wrap gap-1">
              {emojis.map((emoji) => (
                <button
                  key={emoji.id}
                  type="button"
                  title={`:${emoji.name}:`}
                  onClick={() => updateRow(activeRow, { emoji: emoji.display })}
                  className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={emoji.imageUrl} alt={emoji.name} className="h-6 w-6" />
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Si un rol aparece deshabilitado, mueve el rol de Hubbert más arriba en Configuración del servidor → Roles.
        </p>
      </div>

      <div className="flex max-w-md flex-col gap-1">
        <label className={labelClass}>Canal donde publicarlo</label>
        <select className={inputClass} value={channelId} onChange={(e) => setChannelId(e.target.value)} required>
          <option value="">Elegir canal…</option>
          {channels.map((c) => (
            <option key={c.id} value={c.id}>
              #{c.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          El panel se publica al guardar. Si necesitas cambiarlo después, bórralo y crea uno nuevo.
        </p>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={saving || !channelId}
        className="w-fit rounded-md bg-[#5865F2] px-4 py-2 text-sm font-medium text-white hover:bg-[#4752C4] disabled:opacity-50"
      >
        {saving ? "Publicando…" : "Publicar panel"}
      </button>
    </form>
  );
}
