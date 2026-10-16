"use client";

import { useState } from "react";
import { MERCADOPAGO_URL } from "@/lib/donations";
import {
  SUGGESTION_CATEGORIES,
  SUGGESTION_DESCRIPTION_MAX,
  SUGGESTION_DESCRIPTION_MIN,
  SUGGESTION_TITLE_MAX,
  type SuggestionCategory,
} from "@/lib/suggestions";
import { SettingRow, SettingsCard, Toggle, inputClass, labelClass } from "@/components/ui/settings";

const CATEGORY_IDS = Object.keys(SUGGESTION_CATEGORIES) as SuggestionCategory[];

export function DonateButton({ className = "" }: { className?: string }) {
  return (
    <a
      href={MERCADOPAGO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex w-fit items-center gap-2 rounded-lg bg-[#00b1ea] px-4 py-2 text-sm font-medium text-white hover:bg-[#0092c4] ${className}`}
    >
      Donar con Mercado Pago ↗
    </a>
  );
}

export function SuggestionForm({ guildId }: { guildId: string }) {
  const [category, setCategory] = useState<SuggestionCategory>("feature");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [wantsToDonate, setWantsToDonate] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<{ wantsToDonate: boolean } | null>(null);

  const descriptionLength = description.trim().length;
  const canSend = title.trim().length >= 4 && descriptionLength >= SUGGESTION_DESCRIPTION_MIN && !sending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend) return;
    setSending(true);
    setError(null);

    const res = await fetch(`/api/guilds/${guildId}/suggestions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, title, description, wantsToDonate }),
    }).catch(() => null);
    const json = await res?.json().catch(() => null);
    setSending(false);

    if (!json?.success) {
      setError(json?.error?.message ?? "No se pudo enviar la sugerencia. Intenta de nuevo en un rato.");
      return;
    }
    setSent({ wantsToDonate });
    setTitle("");
    setDescription("");
    setWantsToDonate(false);
  }

  if (sent) {
    return (
      <SettingsCard>
        <div className="flex flex-col items-start gap-3 py-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/12 text-lg">✓</span>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">¡Gracias! Tu sugerencia ya le llegó a NGZ.</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {sent.wantsToDonate
                ? "Quedó marcada con 💜 apoyo. Cuando dones, la idea entra a la lista de prioridades."
                : "Si quieres que tu idea avance más rápido, una donación ayuda a dedicarle tiempo."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DonateButton />
            <button
              type="button"
              onClick={() => setSent(null)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Enviar otra sugerencia
            </button>
          </div>
        </div>
      </SettingsCard>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <SettingsCard title="Tu idea" description="Le llega directo al desarrollador de Hubbert por Discord.">
        <div className="flex flex-col gap-1.5">
          <span className={labelClass} id="suggestion-type">
            Tipo
          </span>
          <div role="radiogroup" aria-labelledby="suggestion-type" className="flex flex-wrap gap-1.5">
            {CATEGORY_IDS.map((id) => {
              const cat = SUGGESTION_CATEGORIES[id];
              const on = id === category;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setCategory(id)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                    on
                      ? "border-accent bg-accent/10 font-medium text-zinc-900 dark:text-zinc-50"
                      : "border-zinc-300 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600"
                  }`}
                >
                  <span aria-hidden>{cat.emoji}</span>
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="suggestion-title">
            Título
          </label>
          <input
            id="suggestion-title"
            className={inputClass}
            value={title}
            maxLength={SUGGESTION_TITLE_MAX}
            placeholder={
              category === "bug" ? "ej. El embed no se envía con imágenes WebP" : "ej. Encuestas con botones"
            }
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="suggestion-description">
            Descripción
          </label>
          <textarea
            id="suggestion-description"
            className={inputClass}
            rows={5}
            value={description}
            maxLength={SUGGESTION_DESCRIPTION_MAX}
            placeholder={
              category === "bug"
                ? "Qué hiciste, qué esperabas que pasara y qué pasó."
                : "Qué te gustaría que hiciera Hubbert y para qué lo usarías en tu servidor."
            }
            onChange={(e) => setDescription(e.target.value)}
          />
          <p
            className={`text-right text-xs tabular-nums ${
              descriptionLength > 0 && descriptionLength < SUGGESTION_DESCRIPTION_MIN
                ? "text-amber-600 dark:text-amber-400"
                : "text-zinc-400 dark:text-zinc-500"
            }`}
          >
            {descriptionLength < SUGGESTION_DESCRIPTION_MIN
              ? `Mínimo ${SUGGESTION_DESCRIPTION_MIN} caracteres (${descriptionLength}/${SUGGESTION_DESCRIPTION_MIN})`
              : `${description.length}/${SUGGESTION_DESCRIPTION_MAX}`}
          </p>
        </div>
      </SettingsCard>

      <SettingsCard flush>
        <SettingRow
          title="💜 Quiero apoyar esta idea con una donación"
          description="Tu sugerencia llega destacada y, cuando dones, entra a la lista de prioridades."
        >
          <Toggle checked={wantsToDonate} onChange={setWantsToDonate} label="Quiero apoyar esta idea con una donación" />
        </SettingRow>
      </SettingsCard>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={!canSend}
        className="w-fit rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-strong disabled:opacity-50"
      >
        {sending ? "Enviando…" : "Enviar sugerencia"}
      </button>
    </form>
  );
}
