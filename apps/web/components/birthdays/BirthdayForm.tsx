"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BIRTHDAY_MESSAGE_VARIABLES } from "@hubbert/modules";

interface Member {
  id: string;
  displayName: string;
  username: string;
}

interface Channel {
  id: string;
  name: string;
}

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export interface BirthdayFormInitial {
  id: string;
  discordUserId: string;
  displayName: string;
  day: number;
  month: number;
  year: number | null;
  channelId: string | null;
  customMessage: string | null;
  imageUrl: string | null;
  color: number | null;
  isActive: boolean;
}

export function BirthdayForm({
  guildId,
  initial,
}: {
  guildId: string;
  initial?: BirthdayFormInitial;
}) {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [discordUserId, setDiscordUserId] = useState(initial?.discordUserId ?? "");
  const [day, setDay] = useState(initial?.day ?? 1);
  const [month, setMonth] = useState(initial?.month ?? 1);
  const [year, setYear] = useState(initial?.year?.toString() ?? "");
  const [channelId, setChannelId] = useState(initial?.channelId ?? "");
  const [customMessage, setCustomMessage] = useState(
    initial?.customMessage ?? "¡Feliz cumpleaños, {user}! 🎉"
  );
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [color, setColor] = useState(
    initial?.color != null ? `#${initial.color.toString(16).padStart(6, "0")}` : "#ffd54f"
  );
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/guilds/${guildId}/members`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setMembers(json.data);
      })
      .catch(() => {});
    fetch(`/api/guilds/${guildId}/channels`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setChannels(json.data);
      })
      .catch(() => {});
  }, [guildId]);

  const memberOptions = useMemo(() => {
    if (initial && !members.some((m) => m.id === initial.discordUserId)) {
      return [{ id: initial.discordUserId, displayName: initial.displayName, username: "" }, ...members];
    }
    return members;
  }, [members, initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const selectedMember = memberOptions.find((m) => m.id === discordUserId);

    const payload = {
      discordUserId,
      displayName: selectedMember?.displayName ?? initial?.displayName ?? "",
      day,
      month,
      year: year ? Number(year) : null,
      channelId: channelId || null,
      customMessage: customMessage || null,
      imageUrl: imageUrl || null,
      color: parseInt(color.replace("#", ""), 16),
      isActive,
    };

    const url = initial
      ? `/api/guilds/${guildId}/birthdays/${initial.id}`
      : `/api/guilds/${guildId}/birthdays`;

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

    router.push(`/servers/${guildId}/birthdays`);
    router.refresh();
  }

  const inputClass =
    "w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-[#5865F2] focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
  const labelClass = "text-xs font-medium text-zinc-600 dark:text-zinc-400";

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className={labelClass}>Miembro</label>
        <select
          className={inputClass}
          value={discordUserId}
          onChange={(e) => setDiscordUserId(e.target.value)}
          required
        >
          <option value="">Elegir miembro…</option>
          {memberOptions.map((m) => (
            <option key={m.id} value={m.id}>
              {m.displayName}
              {m.username ? ` (@${m.username})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Día</label>
          <input
            type="number"
            min={1}
            max={31}
            className={inputClass}
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Mes</label>
          <select className={inputClass} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Año (opcional)</label>
          <input
            type="number"
            className={inputClass}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="—"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass}>Canal para la felicitación</label>
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
        <label className={labelClass}>Mensaje personalizado</label>
        <textarea
          className={inputClass}
          rows={2}
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
        />
        <ul className="flex flex-col gap-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          {BIRTHDAY_MESSAGE_VARIABLES.map((v) => (
            <li key={v.token}>
              <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">{v.token}</code> — {v.description}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass}>Imagen del saludo (opcional)</label>
        <input
          type="url"
          className={inputClass}
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://…"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass}>Color del saludo</label>
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

      {message && (
        <p className="text-sm text-red-600 dark:text-red-400">{message.text}</p>
      )}

      <button
        type="submit"
        disabled={saving || !discordUserId}
        className="w-fit rounded-md bg-[#5865F2] px-4 py-2 text-sm font-medium text-white hover:bg-[#4752C4] disabled:opacity-50"
      >
        {saving ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
