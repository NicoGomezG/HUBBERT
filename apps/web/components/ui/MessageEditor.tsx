"use client";

import { useEffect, useRef, useState } from "react";

interface GuildEmoji {
  id: string;
  name: string;
  display: string;
  imageUrl: string;
}

// Formatos de Markdown que Discord entiende. `wrap` rodea la selección.
const FORMATS = [
  { label: "B", title: "Negrita (Ctrl+B)", wrap: "**", key: "b", className: "font-bold" },
  { label: "I", title: "Cursiva (Ctrl+I)", wrap: "*", key: "i", className: "italic" },
  { label: "U", title: "Subrayado (Ctrl+U)", wrap: "__", key: "u", className: "underline" },
  { label: "S", title: "Tachado", wrap: "~~", key: null, className: "line-through" },
  { label: "</>", title: "Código", wrap: "`", key: null, className: "font-mono text-[11px]" },
  { label: "▮", title: "Spoiler", wrap: "||", key: null, className: "" },
] as const;

const EMOJI_CATEGORIES: { name: string; emojis: string[] }[] = [
  {
    name: "Caras",
    emojis: "😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 😉 😍 🥰 😘 😋 😛 😜 🤪 😎 🤩 🥳 😏 😒 😔 😢 😭 😤 😠 😡 🤯 😳 🥺 😱 🤔 🤫 🤭 🙄 😴 🤤 😷 🤒 🤠 🤡 👻 💀 👽 🤖 💩".split(" "),
  },
  {
    name: "Gestos",
    emojis: "👋 🤚 ✋ 👌 🤌 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ 👍 👎 ✊ 👊 👏 🙌 👐 🤝 🙏 💪 👀 🧠 🫶".split(" "),
  },
  {
    name: "Corazones",
    emojis: "❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝".split(" "),
  },
  {
    name: "Celebración",
    emojis: "🎉 🎊 🎈 🎂 🎁 🎀 🏆 🥇 🥈 🥉 🏅 🎖️ ⭐ 🌟 ✨ 💫 🔥 💥 🎆 🎇".split(" "),
  },
  {
    name: "Objetos",
    emojis: "📢 📣 🔔 🔕 📌 📍 📎 📝 📅 📆 ⏰ ⌛ 💡 🔒 🔓 🔑 🛡️ ⚙️ 🔧 🎮 🎧 🎵 🎶 📷 🎬 📺 💻 📱 💰 💎".split(" "),
  },
  {
    name: "Símbolos",
    emojis: "✅ ☑️ ✔️ ❌ ❎ ⚠️ ⛔ 🚫 ❓ ❔ ❗ ❕ ‼️ 💯 🆕 🆗 🆙 🔴 🟠 🟡 🟢 🔵 🟣 ⚫ ⚪ ➡️ ⬅️ ⬆️ ⬇️ 🔗".split(" "),
  },
];

const toolbarButton =
  "flex h-6 min-w-6 items-center justify-center rounded px-1.5 text-xs text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50";

/**
 * Textarea con barra de formato de Discord (negrita, cursiva, etc.) y selector
 * de emojis. Si se pasa `guildId`, el selector incluye los emojis del servidor.
 */
export function MessageEditor({
  value,
  onChange,
  guildId,
  id,
  rows = 3,
  ...props
}: {
  value: string;
  onChange: (value: string) => void;
  guildId?: string;
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange">) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [guildEmojis, setGuildEmojis] = useState<GuildEmoji[] | null>(null);

  useEffect(() => {
    if (!pickerOpen || !guildId || guildEmojis) return;
    fetch(`/api/guilds/${guildId}/emojis`)
      .then((res) => res.json())
      .then((json) => setGuildEmojis(json.success ? json.data : []))
      .catch(() => setGuildEmojis([]));
  }, [pickerOpen, guildId, guildEmojis]);

  useEffect(() => {
    if (!pickerOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (!pickerRef.current?.contains(e.target as Node)) setPickerOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setPickerOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [pickerOpen]);

  // Cambia el valor y deja la selección en [start, end] después del render.
  function apply(next: string, start: number, end: number) {
    onChange(next);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(start, end);
    });
  }

  function wrap(marker: string) {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const m = marker.length;
    const before = value.slice(0, start);
    const selected = value.slice(start, end);
    const after = value.slice(end);

    // Si la selección ya está envuelta con el marcador, lo quita.
    if (before.endsWith(marker) && after.startsWith(marker)) {
      apply(before.slice(0, -m) + selected + after.slice(m), start - m, end - m);
      return;
    }
    if (selected.length >= 2 * m && selected.startsWith(marker) && selected.endsWith(marker)) {
      apply(before + selected.slice(m, -m) + after, start, end - 2 * m);
      return;
    }
    apply(before + marker + selected + marker + after, start + m, end + m);
  }

  function insert(text: string) {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const pos = start + text.length;
    apply(value.slice(0, start) + text + value.slice(end), pos, pos);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
    const format = FORMATS.find((f) => f.key === e.key.toLowerCase());
    if (!format) return;
    e.preventDefault();
    wrap(format.wrap);
  }

  return (
    <div className="rounded-lg border border-zinc-300 bg-white focus-within:border-accent dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-zinc-200 px-1.5 py-1 dark:border-zinc-800">
        {FORMATS.map((f) => (
          <button
            key={f.wrap}
            type="button"
            title={f.title}
            aria-label={f.title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => wrap(f.wrap)}
            className={`${toolbarButton} ${f.className}`}
          >
            {f.label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
        <div ref={pickerRef} className="relative">
          <button
            type="button"
            title="Insertar emoji"
            aria-label="Insertar emoji"
            aria-expanded={pickerOpen}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setPickerOpen((o) => !o)}
            className={`${toolbarButton} text-sm ${pickerOpen ? "bg-zinc-200 dark:bg-zinc-800" : ""}`}
          >
            😀
          </button>
          {pickerOpen && (
            <div className="absolute top-full left-0 z-20 mt-1 max-h-72 w-72 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
              {guildId && guildEmojis === null && (
                <p className="px-1 py-1 text-xs text-zinc-500 dark:text-zinc-400">Cargando emojis del servidor…</p>
              )}
              {guildEmojis && guildEmojis.length > 0 && (
                <EmojiSection name="Del servidor">
                  {guildEmojis.map((emoji) => (
                    <button
                      key={emoji.id}
                      type="button"
                      title={`:${emoji.name}:`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => insert(emoji.display)}
                      className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={emoji.imageUrl} alt={emoji.name} className="h-5 w-5" />
                    </button>
                  ))}
                </EmojiSection>
              )}
              {EMOJI_CATEGORIES.map((cat) => (
                <EmojiSection key={cat.name} name={cat.name}>
                  {cat.emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => insert(emoji)}
                      className="rounded p-1 text-lg leading-none hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      {emoji}
                    </button>
                  ))}
                </EmojiSection>
              ))}
            </div>
          )}
        </div>
      </div>
      <textarea
        ref={textareaRef}
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className="block w-full resize-y rounded-b-lg bg-transparent px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-50"
        {...props}
      />
    </div>
  );
}

function EmojiSection({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="mb-2 last:mb-0">
      <p className="px-1 pb-1 text-[10px] font-medium tracking-wide text-zinc-400 uppercase">{name}</p>
      <div className="flex flex-wrap">{children}</div>
    </div>
  );
}
