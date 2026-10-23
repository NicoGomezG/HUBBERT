"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { copyBirthdaysAction, type CopyBirthdaysResult } from "@/app/servers/[guildId]/birthdays/actions";
import { SettingRow, SettingsCard, Toggle } from "@/components/ui/settings";

interface Channel {
  id: string;
  name: string;
}

export function CopyBirthdaysForm({
  guildId,
  birthdayCount,
  targets,
}: {
  guildId: string;
  birthdayCount: number;
  targets: { id: string; name: string }[];
}) {
  const [targetGuildId, setTargetGuildId] = useState("");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelId, setChannelId] = useState("");
  const [onlyMembers, setOnlyMembers] = useState(true);
  const [result, setResult] = useState<CopyBirthdaysResult | null>(null);
  const [pending, startTransition] = useTransition();

  // Los canales son del servidor destino: se recargan al cambiarlo.
  useEffect(() => {
    if (!targetGuildId) return;
    fetch(`/api/guilds/${targetGuildId}/channels`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setChannels(json.data);
      })
      .catch(() => {});
  }, [targetGuildId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      setResult(await copyBirthdaysAction(guildId, { targetGuildId, channelId: channelId || null, onlyMembers }));
    });
  }

  if (birthdayCount === 0) {
    return (
      <p className="rounded-md border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        Este servidor no tiene cumpleaños para copiar.
      </p>
    );
  }

  if (targets.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        No administras otro servidor con Hubbert instalado.
      </p>
    );
  }

  const inputClass =
    "w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-[#5865F2] focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
  const labelClass = "text-xs font-medium text-zinc-600 dark:text-zinc-400";
  const targetName = targets.find((t) => t.id === targetGuildId)?.name;

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className={labelClass}>Servidor destino</label>
        <select
          className={inputClass}
          value={targetGuildId}
          onChange={(e) => {
            setTargetGuildId(e.target.value);
            setChannels([]);
            setChannelId("");
            setResult(null);
          }}
          required
        >
          <option value="">Elegir servidor…</option>
          {targets.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass}>Canal para las felicitaciones</label>
        <select
          className={inputClass}
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          disabled={!targetGuildId}
        >
          <option value="">Usar el canal por defecto del servidor destino</option>
          {channels.map((c) => (
            <option key={c.id} value={c.id}>
              #{c.name}
            </option>
          ))}
        </select>
      </div>

      <SettingsCard flush>
        <SettingRow
          title="Solo miembros del servidor destino"
          description="Salta a quienes no están en ese servidor, para no felicitar a alguien que no lo ve."
        >
          <Toggle checked={onlyMembers} onChange={setOnlyMembers} label="Solo miembros del servidor destino" />
        </SettingRow>
      </SettingsCard>

      {result && !result.ok && <p className="text-sm text-red-600 dark:text-red-400">{result.error}</p>}

      {result?.ok && (
        <div className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          <p className="font-medium text-emerald-700 dark:text-emerald-400">
            {result.summary.copied === 1
              ? `Se copió 1 cumpleaños a ${targetName}.`
              : `Se copiaron ${result.summary.copied} cumpleaños a ${targetName}.`}
          </p>
          {result.summary.skippedExisting > 0 && <p>{result.summary.skippedExisting} ya existían en el destino.</p>}
          {result.summary.skippedNotMember > 0 && (
            <p>{result.summary.skippedNotMember} no son miembros del servidor destino.</p>
          )}
          <Link href={`/servers/${targetGuildId}/birthdays`} className="w-fit text-[#5865F2] hover:underline">
            Ver cumpleaños de {targetName} →
          </Link>
        </div>
      )}

      <button
        type="submit"
        disabled={pending || !targetGuildId}
        className="w-fit rounded-md bg-[#5865F2] px-4 py-2 text-sm font-medium text-white hover:bg-[#4752C4] disabled:opacity-50"
      >
        {pending ? "Copiando…" : "Copiar cumpleaños"}
      </button>
    </form>
  );
}
