"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TICKET_MESSAGE_VARIABLES, TICKET_WELCOME_DEFAULT } from "@hubbert/modules/client";
import { EmbedPreview } from "@/components/embeds/EmbedPreview";

interface Channel {
  id: string;
  name: string;
}

interface Role {
  id: string;
  name: string;
  color: number;
}

function RoleChecklist({
  roles,
  selected,
  onChange,
}: {
  roles: Role[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((r) => r !== id) : [...selected, id]);
  }

  if (roles.length === 0) {
    return <p className="text-xs text-zinc-500 dark:text-zinc-400">Cargando roles…</p>;
  }

  return (
    <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-md border border-zinc-300 p-2 dark:border-zinc-700">
      {roles.map((role) => (
        <label key={role.id} className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
          <input type="checkbox" checked={selected.includes(role.id)} onChange={() => toggle(role.id)} />
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: role.color ? `#${role.color.toString(16).padStart(6, "0")}` : "#99aab5" }}
          />
          @{role.name}
        </label>
      ))}
    </div>
  );
}

const BUTTON_STYLES = [
  { value: "primary", label: "Azul" },
  { value: "secondary", label: "Gris" },
  { value: "success", label: "Verde" },
  { value: "danger", label: "Rojo" },
] as const;

export interface TicketPanelInitial {
  id: string;
  channelId: string;
  title: string;
  description: string | null;
  color: number | null;
  buttonLabel: string;
  buttonEmoji: string;
  buttonStyle: string;
  welcomeMessage: string | null;
  staffRoleIds: string[];
  requiredRoleIds: string[];
  categoryId: string | null;
  senderName: string | null;
  senderAvatarUrl: string | null;
}

type ButtonStyleValue = (typeof BUTTON_STYLES)[number]["value"];

// Colores reales de los botones de Discord, para la vista previa.
const BUTTON_PREVIEW_COLORS: Record<ButtonStyleValue, string> = {
  primary: "bg-[#5865F2]",
  secondary: "bg-[#4e5058]",
  success: "bg-[#248046]",
  danger: "bg-[#da373c]",
};

export function PanelForm({ guildId, initial }: { guildId: string; initial?: TicketPanelInitial }) {
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [title, setTitle] = useState(initial?.title ?? "Soporte");
  const [description, setDescription] = useState(
    initial ? (initial.description ?? "") : "Haz clic abajo para abrir un ticket privado con el staff."
  );
  const [color, setColor] = useState(
    initial?.color != null ? `#${initial.color.toString(16).padStart(6, "0")}` : "#5865f2"
  );
  const [buttonLabel, setButtonLabel] = useState(initial?.buttonLabel ?? "Abrir ticket");
  const [buttonEmoji, setButtonEmoji] = useState(initial?.buttonEmoji ?? "🎫");
  const [buttonStyle, setButtonStyle] = useState<ButtonStyleValue>(
    BUTTON_STYLES.find((s) => s.value === initial?.buttonStyle)?.value ?? "primary"
  );
  const [welcomeMessage, setWelcomeMessage] = useState(
    initial ? (initial.welcomeMessage ?? "") : TICKET_WELCOME_DEFAULT
  );
  const [senderName, setSenderName] = useState(initial?.senderName ?? "");
  const [senderAvatarUrl, setSenderAvatarUrl] = useState(initial?.senderAvatarUrl ?? "");
  const [channelId, setChannelId] = useState(initial?.channelId ?? "");
  const [roles, setRoles] = useState<Role[]>([]);
  const [categories, setCategories] = useState<Channel[]>([]);
  const [staffRoleIds, setStaffRoleIds] = useState<string[]>(initial?.staffRoleIds ?? []);
  const [requiredRoleIds, setRequiredRoleIds] = useState<string[]>(initial?.requiredRoleIds ?? []);
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const republishes =
    initial != null &&
    ((initial.senderName ?? "") !== senderName ||
      (initial.senderAvatarUrl ?? "") !== senderAvatarUrl ||
      initial.channelId !== channelId);

  useEffect(() => {
    const load = <T,>(path: string, set: (data: T) => void) =>
      fetch(`/api/guilds/${guildId}/${path}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success) set(json.data);
        })
        .catch(() => {});

    load<Channel[]>("channels", setChannels);
    load<Role[]>("roles", setRoles);
    load<Channel[]>("categories", setCategories);
  }, [guildId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await fetch(
      initial ? `/api/guilds/${guildId}/tickets/panels/${initial.id}` : `/api/guilds/${guildId}/tickets/panels`,
      {
        method: initial ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          color: parseInt(color.replace("#", ""), 16),
          buttonLabel,
          buttonEmoji,
          buttonStyle,
          welcomeMessage: welcomeMessage || null,
          channelId,
          staffRoleIds,
          requiredRoleIds,
          categoryId: categoryId || null,
          senderName: senderName || null,
          senderAvatarUrl: senderAvatarUrl || null,
        }),
      }
    );
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
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
          <p className={labelClass}>Remitente (opcional)</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input
              className={inputClass}
              value={senderName}
              maxLength={80}
              placeholder="Nombre (Hubbert)"
              onChange={(e) => setSenderName(e.target.value)}
            />
            <input
              className={inputClass}
              value={senderAvatarUrl}
              placeholder="Avatar (URL)"
              onChange={(e) => setSenderAvatarUrl(e.target.value)}
            />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Se usa en el panel y en el mensaje dentro de cada ticket. Se publica por webhook: el bot necesita Gestionar
            webhooks. Déjalo vacío para publicar como Hubbert.
          </p>
        </div>
  
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
          <label className={labelClass}>Color del panel</label>
          <input
            type="color"
            className="h-9 w-full rounded-md border border-zinc-300 dark:border-zinc-700"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>
  
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <label className={labelClass}>Emoji del botón</label>
            <input
              className={inputClass}
              value={buttonEmoji}
              onChange={(e) => setButtonEmoji(e.target.value)}
              maxLength={32}
              required
            />
          </div>
        </div>
  
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Color del botón</label>
          <select
            className={inputClass}
            value={buttonStyle}
            onChange={(e) => setButtonStyle(e.target.value as ButtonStyleValue)}
          >
            {BUTTON_STYLES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
  
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Mensaje de bienvenida al abrir el ticket</label>
          <textarea
            className={inputClass}
            rows={2}
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
          />
          <ul className="flex flex-col gap-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {TICKET_MESSAGE_VARIABLES.map((v) => (
              <li key={v.token}>
                <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">{v.token}</code> — {v.description}
              </li>
            ))}
          </ul>
        </div>
  
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Quién ve los tickets de este panel</label>
          <RoleChecklist roles={roles} selected={staffRoleIds} onChange={setStaffRoleIds} />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Siempre los ven quien abrió el ticket y los administradores. Marca roles para sumar a otros (por ejemplo
            @kpop) — también podrán cerrarlos.
          </p>
        </div>
  
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Quién puede abrir tickets (opcional)</label>
          <RoleChecklist roles={roles} selected={requiredRoleIds} onChange={setRequiredRoleIds} />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Si marcas roles, solo quien tenga al menos uno de ellos puede apretar el botón. Sin marcar: cualquiera.
          </p>
        </div>
  
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Categoría de los tickets</label>
          <select className={inputClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">La de Configuración del servidor</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
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
        </div>
  
        {initial && (
          <p className="rounded-md bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
            {republishes
              ? "Cambiaste el remitente o el canal: Discord no permite editar eso en un mensaje ya enviado, así que el panel se va a borrar y publicar de nuevo."
              : "Se edita el mismo mensaje en Discord."}{" "}
            Los tickets que ya están abiertos no cambian: los roles, la categoría y el mensaje de bienvenida nuevos
            aplican a los próximos tickets.
          </p>
        )}
  
        {message && <p className="text-sm text-red-600 dark:text-red-400">{message.text}</p>}
  
        <button
          type="submit"
          disabled={saving || !channelId}
          className="w-fit rounded-md bg-[#5865F2] px-4 py-2 text-sm font-medium text-white hover:bg-[#4752C4] disabled:opacity-50"
        >
          {saving ? (initial ? "Guardando…" : "Publicando…") : initial ? "Guardar cambios" : "Publicar panel"}
        </button>
      </form>

      <div className="xl:sticky xl:top-6 xl:self-start">
        <p className={`${labelClass} mb-2`}>Vista previa</p>
        <EmbedPreview
          data={{
            title,
            description,
            color: parseInt(color.replace("#", ""), 16),
            senderName,
            senderAvatarUrl,
            fields: [],
          }}
        />
        <div className="mt-2">
          <span className={`rounded px-3 py-1.5 text-sm font-medium text-white ${BUTTON_PREVIEW_COLORS[buttonStyle]}`}>
            {buttonEmoji} {buttonLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
