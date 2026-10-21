"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EmbedPreview, type EmbedPreviewData } from "@/components/embeds/EmbedPreview";
import { RolePicker, type PickerRole } from "@/components/ui/RolePicker";
import { SettingsCard, inputClass, labelClass } from "@/components/ui/settings";

export interface BroadcastEmbedOption {
  id: string;
  name: string;
  preview: EmbedPreviewData;
}

type Notice = { kind: "ok" | "error"; text: string };

export function BroadcastForm({ guildId, embeds }: { guildId: string; embeds: BroadcastEmbedOption[] }) {
  const router = useRouter();
  const [roles, setRoles] = useState<PickerRole[]>([]);
  const [embedId, setEmbedId] = useState(embeds[0]?.id ?? "");
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [counting, setCounting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState<"test" | "send" | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    fetch(`/api/guilds/${guildId}/roles`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setRoles(json.data);
      })
      .catch(() => {});
  }, [guildId]);

  function changeRoles(ids: string[]) {
    setRoleIds(ids);
    setConfirming(false);
    setCount(null);
    setCounting(ids.length > 0);
  }

  useEffect(() => {
    if (roleIds.length === 0) return;
    let cancelled = false;
    // Pequeña espera para no pedir la lista de miembros en cada click de rol.
    const timer = setTimeout(() => {
      fetch(`/api/guilds/${guildId}/broadcasts/recipients?roleIds=${roleIds.join(",")}`)
        .then((res) => res.json())
        .then((json) => {
          if (!cancelled) setCount(json.success ? json.data.count : null);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setCounting(false);
        });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [guildId, roleIds]);

  const selected = embeds.find((e) => e.id === embedId);

  async function post(path: string, body: unknown) {
    const res = await fetch(`/api/guilds/${guildId}/broadcasts${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  async function sendTest() {
    setBusy("test");
    setNotice(null);
    const json = await post("/test", { embedId }).catch(() => null);
    setBusy(null);
    setNotice(
      json?.success
        ? { kind: "ok", text: "Te llegó la prueba por mensaje directo." }
        : { kind: "error", text: json?.error?.message ?? "No se pudo mandar la prueba." }
    );
  }

  async function send() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setBusy("send");
    setNotice(null);
    const json = await post("", { embedId, roleIds }).catch(() => null);
    setBusy(null);
    setConfirming(false);
    if (!json?.success) {
      setNotice({ kind: "error", text: json?.error?.message ?? "No se pudo crear el envío." });
      return;
    }
    router.push(`/servers/${guildId}/masivos`);
    router.refresh();
  }

  if (embeds.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        Primero crea un embed en{" "}
        <Link href={`/servers/${guildId}/embeds/new`} className="text-accent hover:underline">
          Embeds
        </Link>{" "}
        para poder mandarlo.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <SettingsCard title="Mensaje" description="El embed que va a recibir cada miembro por mensaje directo.">
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Embed</span>
          <select className={inputClass} value={embedId} onChange={(e) => setEmbedId(e.target.value)}>
            {embeds.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>
        {selected && <EmbedPreview data={selected.preview} />}
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          En mensajes directos el embed siempre aparece enviado por Hubbert: el nombre y avatar personalizados solo
          funcionan en canales.
        </p>
      </SettingsCard>

      <SettingsCard title="Destinatarios" description="Reciben el mensaje los miembros que tengan al menos uno de estos roles.">
        <RolePicker roles={roles} selected={roleIds} onChange={changeRoles} />
        <p className="text-sm text-zinc-600 dark:text-zinc-300" role="status">
          {roleIds.length === 0
            ? "Elige al menos un rol."
            : counting
              ? "Contando miembros…"
              : count === null
                ? "No se pudo contar los miembros."
                : `${count} ${count === 1 ? "miembro recibirá" : "miembros recibirán"} el mensaje.`}
        </p>
        {count !== null && count > 0 && (
          <p className="rounded-md bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            Para que Discord no marque al bot como spam, los mensajes salen de a uno cada 3 a 5 segundos: este envío
            tomará unos {Math.max(1, Math.ceil((count * 4) / 60))} min. Puedes cerrar esta página, el envío sigue solo.
          </p>
        )}
      </SettingsCard>

      {notice && (
        <p
          className={`text-sm ${notice.kind === "ok" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
          role="alert"
        >
          {notice.text}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={sendTest}
          disabled={!embedId || busy !== null}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          {busy === "test" ? "Enviando…" : "Enviarme una prueba"}
        </button>
        {confirming && (
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-md px-3 py-2 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Cancelar
          </button>
        )}
        <button
          type="button"
          onClick={send}
          disabled={!embedId || !count || counting || busy !== null}
          className={`rounded-md px-3 py-2 text-sm font-medium text-white disabled:opacity-50 ${
            confirming ? "bg-red-600 hover:bg-red-700" : "bg-[#5865F2] hover:bg-[#4752C4]"
          }`}
        >
          {busy === "send"
            ? "Creando envío…"
            : confirming
              ? `Confirmar: mandar a ${count}`
              : `Enviar a ${count ?? 0} ${count === 1 ? "miembro" : "miembros"}`}
        </button>
      </div>
    </div>
  );
}
