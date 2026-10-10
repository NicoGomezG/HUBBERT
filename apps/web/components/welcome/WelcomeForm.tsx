"use client";

import { useEffect, useMemo, useState } from "react";
import {
  GOODBYE_MESSAGE_VARIABLES,
  HUBBERT_PROMO_BUTTONS,
  HUBBERT_PROMO_FIELDS,
  WELCOME_MESSAGE_VARIABLES,
  CARD_FONTS,
  CARD_TEXT_VARIABLES,
  renderWelcomeMessage,
} from "@hubbert/modules/client";
import { EmbedPreview } from "@/components/embeds/EmbedPreview";

interface Channel {
  id: string;
  name: string;
}

export interface WelcomeFormInitial {
  welcomeEnabled: boolean;
  welcomeChannelId: string | null;
  welcomeTitle: string | null;
  welcomeMessage: string;
  welcomeColor: number | null;
  welcomeImageUrl: string | null;
  showAvatar: boolean;
  pingMember: boolean;
  cardEnabled: boolean;
  cardBackgroundUrl: string | null;
  cardTitle: string;
  cardSubtitle: string;
  cardTextColor: number;
  cardFont: string;
  senderName: string | null;
  senderAvatarUrl: string | null;
  goodbyeEnabled: boolean;
  goodbyeMessage: string;
}

// Datos ficticios solo para la vista previa.
const SAMPLE_NAME = "NuevoMiembro";
const SAMPLE_AVATAR = "https://cdn.discordapp.com/embed/avatars/0.png";
const SAMPLE_MEMBER_COUNT = 128;

function previewText(template: string, guildName: string) {
  return renderWelcomeMessage(template.replaceAll("{usuario}", `@${SAMPLE_NAME}`), {
    discordUserId: "",
    displayName: SAMPLE_NAME,
    guildName,
    memberCount: SAMPLE_MEMBER_COUNT,
  });
}

function VariableList({ variables }: { variables: readonly { token: string; description: string }[] }) {
  return (
    <ul className="flex flex-col gap-0.5 text-xs text-zinc-500 dark:text-zinc-400">
      {variables.map((v) => (
        <li key={v.token}>
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">{v.token}</code> — {v.description}
        </li>
      ))}
    </ul>
  );
}

export function WelcomeForm({
  guildId,
  guildName,
  initial,
}: {
  guildId: string;
  guildName: string;
  initial: WelcomeFormInitial;
}) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [form, setForm] = useState({
    welcomeEnabled: initial.welcomeEnabled,
    welcomeChannelId: initial.welcomeChannelId ?? "",
    welcomeTitle: initial.welcomeTitle ?? "",
    welcomeMessage: initial.welcomeMessage,
    welcomeColor: `#${(initial.welcomeColor ?? 0x5865f2).toString(16).padStart(6, "0")}`,
    welcomeImageUrl: initial.welcomeImageUrl ?? "",
    showAvatar: initial.showAvatar,
    pingMember: initial.pingMember,
    cardEnabled: initial.cardEnabled,
    cardBackgroundUrl: initial.cardBackgroundUrl ?? "",
    cardTitle: initial.cardTitle,
    cardSubtitle: initial.cardSubtitle,
    cardTextColor: `#${initial.cardTextColor.toString(16).padStart(6, "0")}`,
    cardFont: initial.cardFont,
    senderName: initial.senderName ?? "",
    senderAvatarUrl: initial.senderAvatarUrl ?? "",
    goodbyeEnabled: initial.goodbyeEnabled,
    goodbyeMessage: initial.goodbyeMessage,
  });
  const [busy, setBusy] = useState<null | "save" | "welcome" | "goodbye">(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/guilds/${guildId}/channels`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setChannels(json.data);
      })
      .catch(() => {});
  }, [guildId]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // La tarjeta se genera en el servidor: se espera a que deje de escribir para no pedir una imagen por tecla.
  const cardQuery = new URLSearchParams({
    bg: form.cardBackgroundUrl,
    title: form.cardTitle,
    subtitle: form.cardSubtitle,
    accent: form.welcomeColor.replace("#", ""),
    text: form.cardTextColor.replace("#", ""),
    font: form.cardFont,
  }).toString();
  const [cardPreviewUrl, setCardPreviewUrl] = useState("");
  useEffect(() => {
    if (!form.cardEnabled) return;
    const timeout = setTimeout(
      () => setCardPreviewUrl(`/api/guilds/${guildId}/welcome/card-preview?${cardQuery}`),
      600
    );
    return () => clearTimeout(timeout);
  }, [guildId, cardQuery, form.cardEnabled]);

  const welcomePreview = useMemo(
    () => ({
      title: form.welcomeTitle,
      description: previewText(form.welcomeMessage, guildName),
      color: parseInt(form.welcomeColor.replace("#", ""), 16),
      thumbnailUrl: form.showAvatar && !form.cardEnabled ? SAMPLE_AVATAR : null,
      imageUrl: form.cardEnabled ? cardPreviewUrl : form.welcomeImageUrl,
      senderName: form.senderName,
      senderAvatarUrl: form.senderAvatarUrl,
      fields: [],
    }),
    [form, guildName, cardPreviewUrl]
  );

  const goodbyePreview = useMemo(
    () => ({
      title: "👋 ¡Hasta pronto!",
      description: previewText(form.goodbyeMessage, guildName),
      color: 0x5865f2,
      footerText: `Saliste de ${guildName}`,
      fields: HUBBERT_PROMO_FIELDS,
    }),
    [form.goodbyeMessage, guildName]
  );

  async function save(): Promise<boolean> {
    const res = await fetch(`/api/guilds/${guildId}/welcome`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        welcomeChannelId: form.welcomeChannelId || null,
        welcomeTitle: form.welcomeTitle || null,
        welcomeColor: parseInt(form.welcomeColor.replace("#", ""), 16),
        welcomeImageUrl: form.welcomeImageUrl || null,
        cardBackgroundUrl: form.cardBackgroundUrl || null,
        cardTextColor: parseInt(form.cardTextColor.replace("#", ""), 16),
        senderName: form.senderName || null,
        senderAvatarUrl: form.senderAvatarUrl || null,
      }),
    });
    const json = await res.json();
    if (!json.success) setMessage({ kind: "error", text: json.error.message });
    return json.success;
  }

  async function handleSave() {
    setBusy("save");
    setMessage(null);
    if (await save()) setMessage({ kind: "ok", text: "Configuración guardada." });
    setBusy(null);
  }

  // Guarda antes de probar, para que la prueba use exactamente lo que se ve en pantalla.
  async function handleTest(kind: "welcome" | "goodbye") {
    setBusy(kind);
    setMessage(null);
    if (await save()) {
      const res = await fetch(`/api/guilds/${guildId}/welcome/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const json = await res.json();
      setMessage(
        json.success
          ? {
              kind: "ok",
              text:
                kind === "welcome"
                  ? "Guardado y enviado: revisa el canal de bienvenida."
                  : "Guardado y enviado: revisa tus mensajes privados.",
            }
          : { kind: "error", text: json.error.message }
      );
    }
    setBusy(null);
  }

  const inputClass =
    "w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#5865F2] focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
  const labelClass = "text-xs font-medium text-zinc-600 dark:text-zinc-400";
  const sectionClass = "grid grid-cols-1 gap-8 lg:grid-cols-2";
  const toggleClass = "flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-50";
  const testButtonClass =
    "w-fit rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900";

  return (
    <div className="flex flex-col gap-10">
      <section className={sectionClass}>
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Bienvenida</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Se publica en un canal cada vez que entra alguien al servidor.
            </p>
          </div>

          <label className={toggleClass}>
            <input
              type="checkbox"
              checked={form.welcomeEnabled}
              onChange={(e) => set("welcomeEnabled", e.target.checked)}
            />
            Activar bienvenida
          </label>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Canal</label>
            <select
              className={inputClass}
              value={form.welcomeChannelId}
              onChange={(e) => set("welcomeChannelId", e.target.value)}
            >
              <option value="">Elegir canal…</option>
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
            <p className={labelClass}>Remitente (opcional)</p>
            <div className="grid grid-cols-2 gap-4">
              <input
                className={inputClass}
                value={form.senderName}
                maxLength={80}
                placeholder="Nombre (Hubbert)"
                onChange={(e) => set("senderName", e.target.value)}
              />
              <input
                className={inputClass}
                value={form.senderAvatarUrl}
                placeholder="Avatar (URL)"
                onChange={(e) => set("senderAvatarUrl", e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Título</label>
            <input
              className={inputClass}
              value={form.welcomeTitle}
              maxLength={256}
              onChange={(e) => set("welcomeTitle", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Mensaje</label>
            <textarea
              className={inputClass}
              rows={3}
              value={form.welcomeMessage}
              onChange={(e) => set("welcomeMessage", e.target.value)}
            />
            <VariableList variables={WELCOME_MESSAGE_VARIABLES} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Color</label>
              <input
                type="color"
                className="h-9 w-full rounded-md border border-zinc-300 dark:border-zinc-700"
                value={form.welcomeColor}
                onChange={(e) => set("welcomeColor", e.target.value)}
              />
            </div>
            {!form.cardEnabled && (
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Imagen debajo (URL, opcional)</label>
                <input
                  className={inputClass}
                  value={form.welcomeImageUrl}
                  placeholder="https://…/banner.png"
                  onChange={(e) => set("welcomeImageUrl", e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
            <label className={toggleClass}>
              <input
                type="checkbox"
                checked={form.cardEnabled}
                onChange={(e) => set("cardEnabled", e.target.checked)}
              />
              Tarjeta con imagen (estilo Koya)
            </label>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Genera una imagen con tu fondo, el avatar del nuevo miembro en un círculo y los textos encima. El aro del
              avatar usa el color de arriba.
            </p>

            {form.cardEnabled && (
              <>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Fondo (URL de imagen PNG o JPG)</label>
                  <input
                    className={inputClass}
                    value={form.cardBackgroundUrl}
                    placeholder="https://…/fondo.png — vacío: degradado con el color"
                    onChange={(e) => set("cardBackgroundUrl", e.target.value)}
                  />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Tamaño ideal: 1024 × 450. Si la imagen no carga o es WebP/GIF, se usa el degradado.
                  </p>
                </div>
                <div className="grid grid-cols-[1fr_1fr_5rem] gap-4">
                  <div className="flex flex-col gap-1">
                    <label className={labelClass}>Título</label>
                    <input
                      className={inputClass}
                      value={form.cardTitle}
                      maxLength={60}
                      onChange={(e) => set("cardTitle", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={labelClass}>Subtítulo</label>
                    <input
                      className={inputClass}
                      value={form.cardSubtitle}
                      maxLength={80}
                      onChange={(e) => set("cardSubtitle", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={labelClass}>Texto</label>
                    <input
                      type="color"
                      className="h-9 w-full rounded-md border border-zinc-300 dark:border-zinc-700"
                      value={form.cardTextColor}
                      onChange={(e) => set("cardTextColor", e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Fuente del texto</label>
                  <select
                    className={inputClass}
                    value={form.cardFont}
                    onChange={(e) => set("cardFont", e.target.value)}
                  >
                    {CARD_FONTS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
                <VariableList variables={CARD_TEXT_VARIABLES} />
              </>
            )}
          </div>

          {!form.cardEnabled && (
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={form.showAvatar}
                onChange={(e) => set("showAvatar", e.target.checked)}
              />
              Mostrar el avatar del nuevo miembro
            </label>
          )}
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input type="checkbox" checked={form.pingMember} onChange={(e) => set("pingMember", e.target.checked)} />
            Mencionarlo para que le llegue la notificación
          </label>

          <button
            type="button"
            onClick={() => handleTest("welcome")}
            disabled={busy !== null}
            className={testButtonClass}
          >
            {busy === "welcome" ? "Enviando…" : "Probar bienvenida"}
          </button>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <p className={`${labelClass} mb-2`}>Vista previa</p>
          <EmbedPreview data={welcomePreview} />
        </div>
      </section>

      <section className={`${sectionClass} border-t border-zinc-200 pt-8 dark:border-zinc-800`}>
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Despedida</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Se manda por mensaje privado a quien sale del servidor, junto con la info de Hubbert (panel, funciones,
              donaciones y el Discord del creador).
            </p>
          </div>

          <label className={toggleClass}>
            <input
              type="checkbox"
              checked={form.goodbyeEnabled}
              onChange={(e) => set("goodbyeEnabled", e.target.checked)}
            />
            Activar despedida
          </label>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Mensaje</label>
            <textarea
              className={inputClass}
              rows={3}
              maxLength={1500}
              value={form.goodbyeMessage}
              onChange={(e) => set("goodbyeMessage", e.target.value)}
            />
            <VariableList variables={GOODBYE_MESSAGE_VARIABLES} />
          </div>

          <p className="rounded-md bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            Discord solo deja mandar mensajes privados a quien todavía comparte algún servidor con Hubbert y tiene los
            DMs abiertos. Si no, la despedida no le llega (no aparece ningún error en el servidor).
          </p>

          <button
            type="button"
            onClick={() => handleTest("goodbye")}
            disabled={busy !== null}
            className={testButtonClass}
          >
            {busy === "goodbye" ? "Enviando…" : "Probar despedida (te llega por DM)"}
          </button>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <p className={`${labelClass} mb-2`}>Vista previa (mensaje privado)</p>
          <EmbedPreview data={goodbyePreview} />
          <div className="mt-2 flex flex-wrap gap-2">
            {HUBBERT_PROMO_BUTTONS.map((b) => (
              <span key={b.url} className="rounded bg-[#4e5058] px-3 py-1 text-sm font-medium text-white">
                {b.emoji} {b.label} ↗
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            El bloque de Hubbert y los botones van siempre y no se pueden editar.
          </p>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <button
          type="button"
          onClick={handleSave}
          disabled={busy !== null}
          className="rounded-md bg-[#5865F2] px-4 py-2 text-sm font-medium text-white hover:bg-[#4752C4] disabled:opacity-50"
        >
          {busy === "save" ? "Guardando…" : "Guardar"}
        </button>
        {message && (
          <p
            className={`text-sm ${
              message.kind === "ok" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
