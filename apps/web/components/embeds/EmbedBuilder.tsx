"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EmbedPreview } from "./EmbedPreview";

interface FieldValue {
  key: string;
  name: string;
  value: string;
  inline: boolean;
}

export interface EmbedBuilderInitial {
  id: string;
  name: string;
  title: string | null;
  description: string | null;
  url: string | null;
  color: number | null;
  authorName: string | null;
  authorUrl: string | null;
  authorIconUrl: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  footerText: string | null;
  footerIconUrl: string | null;
  showTimestamp: boolean;
  fields: { name: string; value: string; inline: boolean }[];
}

interface Channel {
  id: string;
  name: string;
}

let keyCounter = 0;
function newKey() {
  keyCounter += 1;
  return `f${keyCounter}`;
}

function emptyState(initial?: EmbedBuilderInitial) {
  return {
    name: initial?.name ?? "",
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    url: initial?.url ?? "",
    color: initial?.color != null ? `#${initial.color.toString(16).padStart(6, "0")}` : "#5865f2",
    authorName: initial?.authorName ?? "",
    authorUrl: initial?.authorUrl ?? "",
    authorIconUrl: initial?.authorIconUrl ?? "",
    imageUrl: initial?.imageUrl ?? "",
    thumbnailUrl: initial?.thumbnailUrl ?? "",
    footerText: initial?.footerText ?? "",
    footerIconUrl: initial?.footerIconUrl ?? "",
    showTimestamp: initial?.showTimestamp ?? false,
    fields: (initial?.fields ?? []).map((f) => ({ ...f, key: newKey() })) as FieldValue[],
  };
}

export function EmbedBuilder({
  guildId,
  initial,
}: {
  guildId: string;
  initial?: EmbedBuilderInitial;
}) {
  const router = useRouter();
  const [embedId, setEmbedId] = useState<string | null>(initial?.id ?? null);
  const [form, setForm] = useState(() => emptyState(initial));
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelId, setChannelId] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/guilds/${guildId}/channels`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setChannels(json.data);
      })
      .catch(() => {});
  }, [guildId]);

  const previewData = useMemo(
    () => ({
      title: form.title,
      description: form.description,
      url: form.url,
      color: parseInt(form.color.replace("#", ""), 16),
      authorName: form.authorName,
      authorIconUrl: form.authorIconUrl,
      imageUrl: form.imageUrl,
      thumbnailUrl: form.thumbnailUrl,
      footerText: form.footerText,
      footerIconUrl: form.footerIconUrl,
      showTimestamp: form.showTimestamp,
      fields: form.fields,
    }),
    [form]
  );

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addField() {
    setForm((prev) => ({
      ...prev,
      fields: [...prev.fields, { key: newKey(), name: "", value: "", inline: false }],
    }));
  }

  function updateField(key: string, patch: Partial<FieldValue>) {
    setForm((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (f.key === key ? { ...f, ...patch } : f)),
    }));
  }

  function removeField(key: string) {
    setForm((prev) => ({ ...prev, fields: prev.fields.filter((f) => f.key !== key) }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    const payload = {
      name: form.name,
      title: form.title || null,
      description: form.description || null,
      url: form.url || null,
      color: parseInt(form.color.replace("#", ""), 16),
      authorName: form.authorName || null,
      authorUrl: form.authorUrl || null,
      authorIconUrl: form.authorIconUrl || null,
      imageUrl: form.imageUrl || null,
      thumbnailUrl: form.thumbnailUrl || null,
      footerText: form.footerText || null,
      footerIconUrl: form.footerIconUrl || null,
      showTimestamp: form.showTimestamp,
      fields: form.fields.map(({ name, value, inline }) => ({ name, value, inline })),
    };

    const url = embedId
      ? `/api/guilds/${guildId}/embeds/${embedId}`
      : `/api/guilds/${guildId}/embeds`;

    const res = await fetch(url, {
      method: embedId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSaving(false);

    if (!json.success) {
      setMessage({ kind: "error", text: json.error.message });
      return;
    }

    setMessage({ kind: "ok", text: "Embed guardado." });
    if (!embedId) {
      setEmbedId(json.data.id);
      router.replace(`/servers/${guildId}/embeds/${json.data.id}`);
    }
  }

  async function handleSend() {
    if (!embedId || !channelId) return;
    setSending(true);
    setMessage(null);

    const res = await fetch(`/api/guilds/${guildId}/embeds/${embedId}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId }),
    });
    const json = await res.json();
    setSending(false);

    setMessage(
      json.success
        ? { kind: "ok", text: "Enviado a Discord." }
        : { kind: "error", text: json.error.message }
    );
  }

  const inputClass =
    "w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#5865F2] focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
  const labelClass = "text-xs font-medium text-zinc-600 dark:text-zinc-400";

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Nombre interno</label>
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="ej. Anuncio de evento"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>Título</label>
          <input className={inputClass} value={form.title} onChange={(e) => set("title", e.target.value)} />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass}>Descripción</label>
          <textarea
            className={inputClass}
            rows={4}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Color</label>
            <input
              type="color"
              className="h-9 w-full rounded-md border border-zinc-300 dark:border-zinc-700"
              value={form.color}
              onChange={(e) => set("color", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>URL (opcional, en el título)</label>
            <input className={inputClass} value={form.url} onChange={(e) => set("url", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Nombre del autor</label>
            <input
              className={inputClass}
              value={form.authorName}
              onChange={(e) => set("authorName", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Icono del autor (URL)</label>
            <input
              className={inputClass}
              value={form.authorIconUrl}
              onChange={(e) => set("authorIconUrl", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Imagen (URL)</label>
            <input
              className={inputClass}
              value={form.imageUrl}
              onChange={(e) => set("imageUrl", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Thumbnail (URL)</label>
            <input
              className={inputClass}
              value={form.thumbnailUrl}
              onChange={(e) => set("thumbnailUrl", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Footer</label>
            <input
              className={inputClass}
              value={form.footerText}
              onChange={(e) => set("footerText", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Icono del footer (URL)</label>
            <input
              className={inputClass}
              value={form.footerIconUrl}
              onChange={(e) => set("footerIconUrl", e.target.value)}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={form.showTimestamp}
            onChange={(e) => set("showTimestamp", e.target.checked)}
          />
          Mostrar timestamp actual
        </label>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className={labelClass}>Fields ({form.fields.length}/25)</label>
            <button
              type="button"
              onClick={addField}
              disabled={form.fields.length >= 25}
              className="text-xs font-medium text-[#5865F2] hover:underline disabled:opacity-40"
            >
              + Agregar field
            </button>
          </div>
          {form.fields.map((field) => (
            <div key={field.key} className="flex flex-col gap-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
              <input
                className={inputClass}
                placeholder="Nombre"
                value={field.name}
                onChange={(e) => updateField(field.key, { name: e.target.value })}
              />
              <textarea
                className={inputClass}
                placeholder="Valor"
                rows={2}
                value={field.value}
                onChange={(e) => updateField(field.key, { value: e.target.value })}
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <input
                    type="checkbox"
                    checked={field.inline}
                    onChange={(e) => updateField(field.key, { inline: e.target.checked })}
                  />
                  Inline
                </label>
                <button
                  type="button"
                  onClick={() => removeField(field.key)}
                  className="text-xs text-red-600 hover:underline dark:text-red-400"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {message && (
          <p
            className={`text-sm ${
              message.kind === "ok" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {message.text}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>

          <select
            className={`${inputClass} max-w-[200px]`}
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
          >
            <option value="">Elegir canal…</option>
            {channels.map((c) => (
              <option key={c.id} value={c.id}>
                #{c.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleSend}
            disabled={!embedId || !channelId || sending}
            title={!embedId ? "Guardá el embed primero" : undefined}
            className="rounded-md bg-[#5865F2] px-4 py-2 text-sm font-medium text-white hover:bg-[#4752C4] disabled:opacity-50"
          >
            {sending ? "Enviando…" : "Enviar a Discord"}
          </button>
        </div>
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className={`${labelClass} mb-2`}>Vista previa</p>
        <EmbedPreview data={previewData} />
      </div>
    </div>
  );
}
