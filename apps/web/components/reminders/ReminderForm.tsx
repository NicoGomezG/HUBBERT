"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { REMINDER_MESSAGE_VARIABLES } from "@hubbert/modules";

interface Channel {
  id: string;
  name: string;
}

function toDateInputValue(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export interface ReminderFormInitial {
  id: string;
  title: string;
  description: string | null;
  targetDate: string | Date;
  channelId: string | null;
  daysBefore: number;
  repeatMode: string;
  customMessage: string | null;
  imageUrl: string | null;
  color: number | null;
  isActive: boolean;
}

export function ReminderForm({
  guildId,
  initial,
}: {
  guildId: string;
  initial?: ReminderFormInitial;
}) {
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [targetDate, setTargetDate] = useState(
    initial ? toDateInputValue(initial.targetDate) : ""
  );
  const [channelId, setChannelId] = useState(initial?.channelId ?? "");
  const [daysBefore, setDaysBefore] = useState(initial?.daysBefore ?? 3);
  const [repeatMode, setRepeatMode] = useState(initial?.repeatMode ?? "daily");
  const [customMessage, setCustomMessage] = useState(initial?.customMessage ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [color, setColor] = useState(
    initial?.color != null ? `#${initial.color.toString(16).padStart(6, "0")}` : "#5865f2"
  );
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
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

    const payload = {
      title,
      description: description || null,
      targetDate,
      channelId: channelId || null,
      daysBefore,
      repeatMode,
      customMessage: customMessage || null,
      imageUrl: imageUrl || null,
      color: parseInt(color.replace("#", ""), 16),
      isActive,
    };

    const url = initial
      ? `/api/guilds/${guildId}/reminders/${initial.id}`
      : `/api/guilds/${guildId}/reminders`;

    const res = await fetch(url, {
      method: initial ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setSaving(false);

    if (!json.success) {
      setMessage({ kind: "error", text: json.error.message });
      return;
    }

    router.push(`/servers/${guildId}/reminders`);
    router.refresh();
  }

  const inputClass =
    "w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-[#5865F2] focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
  const labelClass = "text-xs font-medium text-zinc-600 dark:text-zinc-400";

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className={labelClass}>Título</label>
        <input
          type="text"
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Prueba de matemáticas, reunión de equipo…"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass}>Descripción (opcional)</label>
        <textarea
          className={inputClass}
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Fecha del evento</label>
          <input
            type="date"
            className={inputClass}
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Días de anticipación</label>
          <input
            type="number"
            min={0}
            max={365}
            className={inputClass}
            value={daysBefore}
            onChange={(e) => setDaysBefore(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass}>Frecuencia del aviso</label>
        <select className={inputClass} value={repeatMode} onChange={(e) => setRepeatMode(e.target.value)}>
          <option value="daily">Todos los días, desde la anticipación elegida hasta el día del evento</option>
          <option value="once">Una sola vez, justo con esa anticipación</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass}>Canal para el aviso</label>
        <select className={inputClass} value={channelId} onChange={(e) => setChannelId(e.target.value)}>
          <option value="">Usar el canal por defecto del servidor</option>
          {channels.map((c) => (
            <option key={c.id} value={c.id}>
              #{c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass}>Mensaje personalizado (opcional)</label>
        <textarea
          className={inputClass}
          rows={2}
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          placeholder="Si lo dejas vacío, se usa un mensaje automático según los días restantes."
        />
        <ul className="flex flex-col gap-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          {REMINDER_MESSAGE_VARIABLES.map((v) => (
            <li key={v.token}>
              <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">{v.token}</code> — {v.description}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass}>Imagen del aviso (opcional)</label>
        <input
          type="url"
          className={inputClass}
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://…"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass}>Color del aviso</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            className="h-9 w-14 cursor-pointer rounded-md border border-zinc-300 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
          <span className="text-sm text-zinc-600 dark:text-zinc-300">{color}</span>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Activo
      </label>

      {message && <p className="text-sm text-red-600 dark:text-red-400">{message.text}</p>}

      <button
        type="submit"
        disabled={saving || !title || !targetDate}
        className="w-fit rounded-md bg-[#5865F2] px-4 py-2 text-sm font-medium text-white hover:bg-[#4752C4] disabled:opacity-50"
      >
        {saving ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
