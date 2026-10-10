"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { REACTION_ROLE_MAX_OPTIONS, REACTION_ROLE_MODES } from "@hubbert/modules";
import { EmbedPreview } from "@/components/embeds/EmbedPreview";

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

export interface ReactionRolePanelInitial {
  id: string;
  channelId: string;
  title: string;
  description: string | null;
  color: number | null;
  imageUrl: string | null;
  mode: string;
  senderName: string | null;
  senderAvatarUrl: string | null;
  options: { emoji: string; roleId: string; label: string | null }[];
}

const EMPTY_ROW: OptionRow = { emoji: "", roleId: "", label: "" };

// En la vista previa los emojis custom se muestran como :nombre: (como los ve
// alguien sin acceso al emoji) y las menciones de rol como @rol.
function previewEmoji(emoji: string) {
  return emoji.replace(/^<a?:(\w+):\d+>$/, ":$1:");
}

export function ReactionRolePanelForm({
  guildId,
  initial,
}: {
  guildId: string;
  initial?: ReactionRolePanelInitial;
}) {
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [emojis, setEmojis] = useState<GuildEmoji[]>([]);
  const [title, setTitle] = useState(initial?.title ?? "Elige tus roles");
  const [description, setDescription] = useState(
    initial ? (initial.description ?? "") : "Reacciona con el emoji del rol que quieres."
  );
  const [color, setColor] = useState(
    initial?.color != null ? `#${initial.color.toString(16).padStart(6, "0")}` : "#5865f2"
  );
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [senderName, setSenderName] = useState(initial?.senderName ?? "");
  const [senderAvatarUrl, setSenderAvatarUrl] = useState(initial?.senderAvatarUrl ?? "");
  const [mode, setMode] = useState<Mode>(initial?.mode === "single" ? "single" : "multiple");
  const [options, setOptions] = useState<OptionRow[]>(
    initial?.options.length
      ? initial.options.map((o) => ({ emoji: o.emoji, roleId: o.roleId, label: o.label ?? "" }))
      : [{ ...EMPTY_ROW }]
  );
  const [activeRow, setActiveRow] = useState(0);
  const [channelId, setChannelId] = useState(initial?.channelId ?? "");
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

  const previewData = useMemo(() => {
    const roleName = new Map(roles.map((r) => [r.id, r.name]));
    const lines = options
      .filter((o) => o.emoji || o.roleId)
      .map(
        (o) =>
          `${previewEmoji(o.emoji) || "❔"} — @${roleName.get(o.roleId) ?? "rol"}${o.label ? ` · ${o.label}` : ""}`
      );
    return {
      title,
      description: [description, lines.join("\n")].filter(Boolean).join("\n\n"),
      color: parseInt(color.replace("#", ""), 16),
      imageUrl,
      footerText: REACTION_ROLE_MODES.find((m) => m.value === mode)?.footer,
      senderName,
      senderAvatarUrl,
      fields: [],
    };
  }, [title, description, color, imageUrl, mode, senderName, senderAvatarUrl, options, roles]);

  const senderChanged =
    initial != null &&
    ((initial.senderName ?? "") !== senderName ||
      (initial.senderAvatarUrl ?? "") !== senderAvatarUrl ||
      initial.channelId !== channelId);

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

    const res = await fetch(
      initial ? `/api/guilds/${guildId}/reaction-roles/${initial.id}` : `/api/guilds/${guildId}/reaction-roles`,
      {
        method: initial ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          color: parseInt(color.replace("#", ""), 16),
          imageUrl: imageUrl || null,
          senderName: senderName || null,
          senderAvatarUrl: senderAvatarUrl || null,
          mode,
          channelId,
          options: options.map((o) => ({ emoji: o.emoji, roleId: o.roleId, label: o.label || null })),
        }),
      }
    );
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
    "w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#5865F2] focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
  const labelClass = "text-xs font-medium text-zinc-600 dark:text-zinc-400";

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
          <p className={labelClass}>Remitente (opcional)</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Nombre</label>
              <input
                className={inputClass}
                value={senderName}
                maxLength={80}
                placeholder="Hubbert"
                onChange={(e) => setSenderName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Avatar (URL)</label>
              <input
                className={inputClass}
                value={senderAvatarUrl}
                placeholder="https://…/logo.png"
                onChange={(e) => setSenderAvatarUrl(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Cambia el nombre y la foto con que aparece el panel (se publica por webhook; el bot necesita Gestionar
            webhooks). Déjalo vacío para publicarlo como Hubbert.
          </p>
        </div>

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

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Color del panel</label>
            <input
              type="color"
              className="h-9 w-full rounded-md border border-zinc-300 dark:border-zinc-700"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Imagen debajo (URL, opcional)</label>
            <input
              className={inputClass}
              value={imageUrl}
              placeholder="https://…/banner.png"
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>Modo</label>
          <div className="grid gap-2 sm:grid-cols-2">
            {REACTION_ROLE_MODES.map((m) => (
              <label
                key={m.value}
                className={`flex cursor-pointer flex-col gap-0.5 rounded-md border px-3 py-2 text-sm ${
                  mode === m.value ? "border-[#5865F2] bg-[#5865F2]/5" : "border-zinc-300 dark:border-zinc-700"
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
        </div>

        {initial && (
          <p className="rounded-md bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            {senderChanged
              ? "Cambiaste el remitente o el canal: Discord no permite editar eso en un mensaje ya enviado, así que el panel se va a borrar y publicar de nuevo. Los roles que los miembros ya tienen se mantienen, pero se pierden los contadores de reacciones."
              : "Se edita el mismo mensaje. Si quitas un emoji, se borran sus reacciones, pero los miembros conservan el rol que ya tenían."}
          </p>
        )}

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={saving || !channelId}
          className="w-fit rounded-md bg-[#5865F2] px-4 py-2 text-sm font-medium text-white hover:bg-[#4752C4] disabled:opacity-50"
        >
          {saving ? (initial ? "Guardando…" : "Publicando…") : initial ? "Guardar cambios" : "Publicar panel"}
        </button>
      </form>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className={`${labelClass} mb-2`}>Vista previa</p>
        <EmbedPreview data={previewData} />
      </div>
    </div>
  );
}
