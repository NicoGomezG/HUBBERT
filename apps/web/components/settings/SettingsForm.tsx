"use client";

import { useState } from "react";

interface Channel {
  id: string;
  name: string;
}

export function SettingsForm({
  guildId,
  timezones,
  channels,
  initialTimezone,
  initialChannelId,
}: {
  guildId: string;
  timezones: string[];
  channels: Channel[];
  initialTimezone: string;
  initialChannelId: string | null;
}) {
  const [timezone, setTimezone] = useState(initialTimezone);
  const [defaultChannelId, setDefaultChannelId] = useState(initialChannelId ?? "");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [testMessage, setTestMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await fetch(`/api/guilds/${guildId}/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone, defaultChannelId: defaultChannelId || null }),
    });
    const json = await res.json();
    setSaving(false);

    setMessage(
      json.success
        ? { kind: "ok", text: "Configuración guardada." }
        : { kind: "error", text: json.error.message }
    );
  }

  async function handleTest() {
    if (!defaultChannelId) return;
    setTesting(true);
    setTestMessage(null);

    const res = await fetch(`/api/guilds/${guildId}/settings/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId: defaultChannelId }),
    });
    const json = await res.json();
    setTesting(false);

    setTestMessage(
      json.success
        ? { kind: "ok", text: "Enviado — revisa el canal en Discord." }
        : { kind: "error", text: json.error.message }
    );
  }

  const inputClass =
    "w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-[#5865F2] focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
  const labelClass = "text-xs font-medium text-zinc-600 dark:text-zinc-400";

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className={labelClass}>Zona horaria del servidor</label>
        <select className={inputClass} value={timezone} onChange={(e) => setTimezone(e.target.value)}>
          {timezones.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Se usa para decidir a qué hora local se envían las felicitaciones de cumpleaños.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass}>Canal por defecto</label>
        <select
          className={inputClass}
          value={defaultChannelId}
          onChange={(e) => setDefaultChannelId(e.target.value)}
        >
          <option value="">Sin canal por defecto</option>
          {channels.map((c) => (
            <option key={c.id} value={c.id}>
              #{c.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Se usa para los cumpleaños que no tengan un canal propio asignado.
        </p>
        <button
          type="button"
          onClick={handleTest}
          disabled={!defaultChannelId || testing}
          className="w-fit rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          {testing ? "Enviando…" : "Enviar mensaje de prueba"}
        </button>
        {testMessage && (
          <p
            className={`text-xs ${
              testMessage.kind === "ok" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {testMessage.text}
          </p>
        )}
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

      <button
        type="submit"
        disabled={saving}
        className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {saving ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
