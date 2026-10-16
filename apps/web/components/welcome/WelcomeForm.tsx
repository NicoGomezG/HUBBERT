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
import {
  ModuleToggle,
  SaveBar,
  SettingRow,
  SettingsCard,
  StatusPill,
  SubTabs,
  Toggle,
  inputClass,
  labelClass,
} from "@/components/ui/settings";

const colorClass = "h-[34px] w-full cursor-pointer rounded-lg border border-zinc-300 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900";

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
  const [tab, setTab] = useState<"bienvenida" | "despedida">("bienvenida");
  const [saved, setSaved] = useState(() => ({
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
  }));
  const [form, setForm] = useState(saved);
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
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
    setMessage(null);
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
    const snapshot = form;
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
    if (json.success) setSaved(snapshot);
    else setMessage({ kind: "error", text: json.error.message });
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

  const goodbyeTab = tab === "despedida";

  return (
    <div className="flex flex-col gap-5">
      <SubTabs
        tabs={[
          { id: "bienvenida", label: "Bienvenida", badge: <StatusPill on={form.welcomeEnabled} /> },
          { id: "despedida", label: "Despedida", badge: <StatusPill on={form.goodbyeEnabled} /> },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        {!goodbyeTab ? (
          <div className="flex min-w-0 flex-col gap-4">
            <ModuleToggle
              icon={<SparkIcon />}
              title="Mensaje de bienvenida"
              description="Se publica en un canal cada vez que entra alguien al servidor."
              checked={form.welcomeEnabled}
              onChange={(v) => set("welcomeEnabled", v)}
            />

            <SettingsCard title="Contenido" description="Dónde y qué se publica." disabled={!form.welcomeEnabled}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_8rem]">
                <div className="flex flex-col gap-1">
                  <label className={labelClass} htmlFor="welcome-channel">
                    Canal
                  </label>
                  <select
                    id="welcome-channel"
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
                <div className="flex flex-col gap-1">
                  <label className={labelClass} htmlFor="welcome-color">
                    Color
                  </label>
                  <input
                    id="welcome-color"
                    type="color"
                    className={colorClass}
                    value={form.welcomeColor}
                    onChange={(e) => set("welcomeColor", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass} htmlFor="welcome-title">
                  Título
                </label>
                <input
                  id="welcome-title"
                  className={inputClass}
                  value={form.welcomeTitle}
                  maxLength={256}
                  onChange={(e) => set("welcomeTitle", e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className={labelClass} htmlFor="welcome-message">
                  Mensaje
                </label>
                <textarea
                  id="welcome-message"
                  className={inputClass}
                  rows={3}
                  value={form.welcomeMessage}
                  onChange={(e) => set("welcomeMessage", e.target.value)}
                />
                <VariableList variables={WELCOME_MESSAGE_VARIABLES} />
              </div>
            </SettingsCard>

            <SettingsCard
              title="Tarjeta con imagen"
              description="Fondo + avatar del nuevo miembro en un círculo + textos. El aro del avatar usa el color del embed."
              action={
                <Toggle
                  checked={form.cardEnabled}
                  onChange={(v) => set("cardEnabled", v)}
                  label="Tarjeta con imagen"
                  disabled={!form.welcomeEnabled}
                />
              }
              disabled={!form.welcomeEnabled}
            >
              {form.cardEnabled ? (
                <>
                  <div className="flex flex-col gap-1">
                    <label className={labelClass} htmlFor="card-bg">
                      Fondo (URL de imagen PNG o JPG)
                    </label>
                    <input
                      id="card-bg"
                      className={inputClass}
                      value={form.cardBackgroundUrl}
                      placeholder="https://…/fondo.png — vacío: degradado con el color"
                      onChange={(e) => set("cardBackgroundUrl", e.target.value)}
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Tamaño ideal: 1024 × 450. Si la imagen no carga o es WebP/GIF, se usa el degradado.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <label className={labelClass} htmlFor="card-title">
                        Título
                      </label>
                      <input
                        id="card-title"
                        className={inputClass}
                        value={form.cardTitle}
                        maxLength={60}
                        onChange={(e) => set("cardTitle", e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className={labelClass} htmlFor="card-subtitle">
                        Subtítulo
                      </label>
                      <input
                        id="card-subtitle"
                        className={inputClass}
                        value={form.cardSubtitle}
                        maxLength={80}
                        onChange={(e) => set("cardSubtitle", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_8rem]">
                    <div className="flex flex-col gap-1">
                      <label className={labelClass} htmlFor="card-font">
                        Fuente del texto
                      </label>
                      <select
                        id="card-font"
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
                    <div className="flex flex-col gap-1">
                      <label className={labelClass} htmlFor="card-text-color">
                        Color del texto
                      </label>
                      <input
                        id="card-text-color"
                        type="color"
                        className={colorClass}
                        value={form.cardTextColor}
                        onChange={(e) => set("cardTextColor", e.target.value)}
                      />
                    </div>
                  </div>
                  <VariableList variables={CARD_TEXT_VARIABLES} />
                </>
              ) : (
                <div className="flex flex-col gap-1">
                  <label className={labelClass} htmlFor="welcome-image">
                    Imagen debajo del mensaje (URL, opcional)
                  </label>
                  <input
                    id="welcome-image"
                    className={inputClass}
                    value={form.welcomeImageUrl}
                    placeholder="https://…/banner.png"
                    onChange={(e) => set("welcomeImageUrl", e.target.value)}
                  />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Activa la tarjeta para generar una imagen con el avatar del nuevo miembro.
                  </p>
                </div>
              )}
            </SettingsCard>

            <SettingsCard title="Opciones" flush disabled={!form.welcomeEnabled}>
              <SettingRow
                title="Mostrar avatar"
                description={
                  form.cardEnabled
                    ? "No aplica: la tarjeta ya muestra el avatar."
                    : "Miniatura del nuevo miembro arriba a la derecha."
                }
                dimmed={form.cardEnabled}
              >
                <Toggle
                  checked={form.showAvatar}
                  onChange={(v) => set("showAvatar", v)}
                  label="Mostrar avatar"
                  disabled={form.cardEnabled}
                />
              </SettingRow>
              <SettingRow title="Mencionar al miembro" description="Le llega la notificación cuando se publica.">
                <Toggle checked={form.pingMember} onChange={(v) => set("pingMember", v)} label="Mencionar al miembro" />
              </SettingRow>
            </SettingsCard>

            <SettingsCard
              title="Remitente"
              description="Opcional. Vacío usa el nombre y el avatar de Hubbert."
              disabled={!form.welcomeEnabled}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className={labelClass} htmlFor="sender-name">
                    Nombre
                  </label>
                  <input
                    id="sender-name"
                    className={inputClass}
                    value={form.senderName}
                    maxLength={80}
                    placeholder="Hubbert"
                    onChange={(e) => set("senderName", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass} htmlFor="sender-avatar">
                    Avatar (URL)
                  </label>
                  <input
                    id="sender-avatar"
                    className={inputClass}
                    value={form.senderAvatarUrl}
                    placeholder="https://…"
                    onChange={(e) => set("senderAvatarUrl", e.target.value)}
                  />
                </div>
              </div>
            </SettingsCard>
          </div>
        ) : (
          <div className="flex min-w-0 flex-col gap-4">
            <ModuleToggle
              icon={<WaveIcon />}
              title="Mensaje de despedida"
              description="Se manda por DM a quien sale del servidor, junto con la info de Hubbert."
              checked={form.goodbyeEnabled}
              onChange={(v) => set("goodbyeEnabled", v)}
            />

            <SettingsCard title="Contenido" disabled={!form.goodbyeEnabled}>
              <div className="flex flex-col gap-1">
                <label className={labelClass} htmlFor="goodbye-message">
                  Mensaje
                </label>
                <textarea
                  id="goodbye-message"
                  className={inputClass}
                  rows={3}
                  maxLength={1500}
                  value={form.goodbyeMessage}
                  onChange={(e) => set("goodbyeMessage", e.target.value)}
                />
                <VariableList variables={GOODBYE_MESSAGE_VARIABLES} />
              </div>
              <p className="rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                Discord solo deja mandar mensajes privados a quien todavía comparte algún servidor con Hubbert y tiene
                los DMs abiertos. Si no, la despedida no le llega (no aparece ningún error en el servidor).
              </p>
            </SettingsCard>
          </div>
        )}

        <div className="flex min-w-0 flex-col gap-2 xl:sticky xl:top-6 xl:self-start">
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-[10px] tracking-[0.16em] text-zinc-400 uppercase dark:text-zinc-500">
              {goodbyeTab ? "Vista previa · mensaje privado" : "Vista previa"}
            </p>
            <button
              type="button"
              onClick={() => handleTest(goodbyeTab ? "goodbye" : "welcome")}
              disabled={busy !== null}
              className="rounded-lg border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              {busy === "welcome" || busy === "goodbye"
                ? "Enviando…"
                : goodbyeTab
                  ? "Probar (te llega por DM)"
                  : "Probar en Discord"}
            </button>
          </div>
          {goodbyeTab ? (
            <>
              <EmbedPreview data={goodbyePreview} />
              <div className="flex flex-wrap gap-2">
                {HUBBERT_PROMO_BUTTONS.map((b) => (
                  <span key={b.url} className="rounded bg-[#4e5058] px-3 py-1 text-sm font-medium text-white">
                    {b.emoji} {b.label} ↗
                  </span>
                ))}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                El bloque de Hubbert y los botones van siempre y no se pueden editar.
              </p>
            </>
          ) : (
            <EmbedPreview data={welcomePreview} />
          )}
        </div>
      </div>

      <SaveBar dirty={dirty} message={message}>
        {dirty && (
          <button
            type="button"
            onClick={() => {
              setForm(saved);
              setMessage(null);
            }}
            disabled={busy !== null}
            className="rounded-lg px-3 py-1.5 text-sm font-medium opacity-70 hover:opacity-100 disabled:opacity-40"
          >
            Descartar
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={busy !== null || !dirty}
          className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-strong disabled:opacity-50"
        >
          {busy === "save" ? "Guardando…" : "Guardar cambios"}
        </button>
      </SaveBar>
    </div>
  );
}

function SparkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
      <path d="M19 16v5" />
      <path d="M16.5 18.5h5" />
    </svg>
  );
}

function WaveIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}
