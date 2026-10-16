"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EmbedPreview } from "./EmbedPreview";
import { SaveBar, SettingRow, SettingsCard, SubTabs, Toggle, inputClass, labelClass } from "@/components/ui/settings";

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
  senderName: string | null;
  senderAvatarUrl: string | null;
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
    senderName: initial?.senderName ?? "",
    senderAvatarUrl: initial?.senderAvatarUrl ?? "",
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
  const [tab, setTab] = useState<"contenido" | "fields" | "imagenes">("contenido");
  const [saved, setSaved] = useState(() => emptyState(initial));
  const [form, setForm] = useState(saved);
  const dirty = !embedId || JSON.stringify(form) !== JSON.stringify(saved);
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
      senderName: form.senderName || null,
      senderAvatarUrl: form.senderAvatarUrl || null,
      fields: form.fields,
    }),
    [form]
  );

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setMessage(null);
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

    const snapshot = form;
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
      senderName: form.senderName || null,
      senderAvatarUrl: form.senderAvatarUrl || null,
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

    setSaved(snapshot);
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

  function field(id: keyof typeof form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) {
    return (
      <div className="flex flex-col gap-1">
        <label className={labelClass} htmlFor={`embed-${id}`}>
          {label}
        </label>
        <input
          id={`embed-${id}`}
          className={inputClass}
          value={form[id] as string}
          onChange={(e) => set(id, e.target.value as never)}
          {...props}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <SubTabs
        tabs={[
          { id: "contenido", label: "Contenido" },
          {
            id: "fields",
            label: "Fields",
            badge: (
              <span className="rounded-full bg-zinc-100 px-2 py-px text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {form.fields.length}
              </span>
            ),
          },
          { id: "imagenes", label: "Imágenes y footer" },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <div className="flex min-w-0 flex-col gap-4">
          {tab === "contenido" && (
            <>
              <SettingsCard title="General">
                {field("name", "Nombre interno", { placeholder: "ej. Anuncio de evento" })}
                {field("title", "Título")}
                <div className="flex flex-col gap-1">
                  <label className={labelClass} htmlFor="embed-description">
                    Descripción
                  </label>
                  <textarea
                    id="embed-description"
                    className={inputClass}
                    rows={4}
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[8rem_1fr]">
                  <div className="flex flex-col gap-1">
                    <label className={labelClass} htmlFor="embed-color">
                      Color
                    </label>
                    <input
                      id="embed-color"
                      type="color"
                      className="h-[34px] w-full cursor-pointer rounded-lg border border-zinc-300 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900"
                      value={form.color}
                      onChange={(e) => set("color", e.target.value)}
                    />
                  </div>
                  {field("url", "URL (opcional, en el título)")}
                </div>
              </SettingsCard>

              <SettingsCard title="Autor">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {field("authorName", "Nombre del autor")}
                  {field("authorIconUrl", "Icono del autor (URL)")}
                </div>
              </SettingsCard>

              <SettingsCard
                title="Remitente"
                description="Opcional. Cambia el nombre y la foto con que aparece el mensaje. Se envía mediante un webhook del canal, así que el bot necesita el permiso Gestionar webhooks."
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {field("senderName", "Nombre", { maxLength: 80, placeholder: "Hubbert" })}
                  {field("senderAvatarUrl", "Avatar (URL)", { placeholder: "https://…/logo.png" })}
                </div>
              </SettingsCard>
            </>
          )}

          {tab === "fields" && (
            <SettingsCard
              title={`Fields (${form.fields.length}/25)`}
              description="“En línea” pone hasta 3 fields por fila en Discord."
              action={
                <button
                  type="button"
                  onClick={addField}
                  disabled={form.fields.length >= 25}
                  className="rounded-lg border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  + Agregar field
                </button>
              }
              flush
            >
              {form.fields.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  Este embed todavía no tiene fields.
                </p>
              )}
              {form.fields.map((f) => (
                <div
                  key={f.key}
                  className="flex flex-col gap-2 border-t border-zinc-200 p-4 first:border-t-0 dark:border-zinc-800"
                >
                  <input
                    className={inputClass}
                    placeholder="Nombre"
                    aria-label="Nombre del field"
                    value={f.name}
                    onChange={(e) => updateField(f.key, { name: e.target.value })}
                  />
                  <textarea
                    className={inputClass}
                    placeholder="Valor"
                    aria-label="Valor del field"
                    rows={2}
                    value={f.value}
                    onChange={(e) => updateField(f.key, { value: e.target.value })}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                      <Toggle
                        size="sm"
                        checked={f.inline}
                        onChange={(v) => updateField(f.key, { inline: v })}
                        label="En línea"
                      />
                      En línea
                    </div>
                    <button
                      type="button"
                      onClick={() => removeField(f.key)}
                      className="rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-red-500/10 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </SettingsCard>
          )}

          {tab === "imagenes" && (
            <>
              <SettingsCard title="Imágenes">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {field("imageUrl", "Imagen (URL)")}
                  {field("thumbnailUrl", "Thumbnail (URL)")}
                </div>
              </SettingsCard>

              <SettingsCard title="Footer">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {field("footerText", "Texto")}
                  {field("footerIconUrl", "Icono (URL)")}
                </div>
              </SettingsCard>

              <SettingsCard flush>
                <SettingRow title="Mostrar fecha y hora" description="Agrega el momento del envío al pie del embed.">
                  <Toggle
                    checked={form.showTimestamp}
                    onChange={(v) => set("showTimestamp", v)}
                    label="Mostrar fecha y hora"
                  />
                </SettingRow>
              </SettingsCard>
            </>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-2 xl:sticky xl:top-6 xl:self-start">
          <p className="font-mono text-[10px] tracking-[0.16em] text-zinc-400 uppercase dark:text-zinc-500">
            Vista previa
          </p>
          <EmbedPreview data={previewData} />
        </div>
      </div>

      <SaveBar dirty={dirty} message={message}>
        <select
          aria-label="Canal de envío"
          className="max-w-[180px] rounded-lg border border-zinc-700 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-300"
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
          disabled={!embedId || !channelId || dirty || sending}
          title={!embedId || dirty ? "Guarda los cambios primero" : undefined}
          className="rounded-lg px-3 py-1.5 text-sm font-medium ring-1 ring-zinc-700 hover:bg-white/10 disabled:opacity-40 dark:ring-zinc-300 dark:hover:bg-black/5"
        >
          {sending ? "Enviando…" : "Enviar a Discord"}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !dirty || !form.name.trim()}
          className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-strong disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </SaveBar>
    </div>
  );
}
