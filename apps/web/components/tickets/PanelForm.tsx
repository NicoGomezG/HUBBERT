"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Channel {
  id: string;
  name: string;
}

export function PanelForm({ guildId }: { guildId: string }) {
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [title, setTitle] = useState("Soporte");
  const [description, setDescription] = useState("Haz clic abajo para abrir un ticket privado con el staff.");
  const [buttonLabel, setButtonLabel] = useState("Abrir ticket");
  const [channelId, setChannelId] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/guilds/${guildId}/channels`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setChannels(json.data);
      })
      .catch(() => {});
  }, [guildId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await fetch(`/api/guilds/${guildId}/tickets/panels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description: description || null, buttonLabel, channelId }),
    });
    const json = await res.json();
    setSaving(false);

    if (!json.success) {
      setMessage({ kind: "error", text: json.error.message });
      return;
    }

    router.push(`/servers/${guildId}/tickets`);
    router.refresh();
  }

  const inputClass =
    "w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-[#5865F2] focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
  const labelClass = "text-xs font-medium text-zinc-600 dark:text-zinc-400";

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
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
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass}>Texto del botón</label>
        <input
          className={inputClass}
          value={buttonLabel}
          onChange={(e) => setButtonLabel(e.target.value)}
          maxLength={80}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
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

      {message && <p className="text-sm text-red-600 dark:text-red-400">{message.text}</p>}

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
