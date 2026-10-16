import Link from "next/link";
import { DISCORD_COMMANDS } from "@hubbert/discord";
import { CountBadge, LinkTabs } from "@/components/ui/settings";

interface HelpSection {
  slug: string;
  title: string;
  summary: string;
  steps: string[];
}

const GROUPS: { label: string; sections: HelpSection[] }[] = [
  {
    label: "Mensajes",
    sections: [
      {
        slug: "embeds",
        title: "Embeds",
        summary: "Mensajes con formato que guardas y reenvías cuando quieras.",
        steps: [
          "Ve a Embeds y haz clic en \"+ Nuevo embed\".",
          "En Contenido completa nombre, título, descripción y color. En Fields agrega los campos que quieras y marca \"En línea\" para ponerlos lado a lado.",
          "En Imágenes y footer agrega imagen, thumbnail, footer y, si quieres, la fecha y hora del envío.",
          "Opcional: en Remitente puedes cambiar el nombre y el avatar con que aparece el mensaje (el bot necesita el permiso Gestionar webhooks).",
          "Guarda, elige el canal en la barra de abajo y toca \"Enviar a Discord\". Queda guardado para reenviarlo después.",
        ],
      },
      {
        slug: "bienvenida",
        title: "Bienvenida y despedida",
        summary: "Saluda a quien entra y despide a quien sale.",
        steps: [
          "Ve a Bienvenida, activa el mensaje y elige el canal donde se publica.",
          "Personaliza título, mensaje y color. Puedes usar {usuario}, {nombre}, {servidor} y {miembros}.",
          "Activa la tarjeta con imagen para generar un banner con el avatar del nuevo miembro, o pon una imagen fija debajo del mensaje.",
          "En la tab Despedida activa el mensaje privado que le llega a quien sale, junto con la información de Hubbert. Solo le llega si todavía comparte algún servidor con el bot.",
          "Usa \"Probar en Discord\" sobre la vista previa: guarda y envía el mensaje como si fueras tú quien entra o sale.",
        ],
      },
      {
        slug: "reminders",
        title: "Recordatorios",
        summary: "Avisos con anticipación para pruebas, reuniones o vencimientos.",
        steps: [
          "Ve a Recordatorios y haz clic en \"+ Nuevo recordatorio\".",
          "Completa un título, la fecha del evento y el canal donde se va a avisar.",
          "Elige con cuántos días de anticipación quieres el aviso, y si quieres que sea diario (por ejemplo, para estudiar para una prueba) o una sola vez (por ejemplo, una reunión importante).",
          "Con el toggle de cada recordatorio lo pausas sin borrarlo.",
        ],
      },
    ],
  },
  {
    label: "Comunidad",
    sections: [
      {
        slug: "birthdays",
        title: "Cumpleaños",
        summary: "Felicitaciones automáticas el día que corresponde.",
        steps: [
          "Ve a Cumpleaños y haz clic en \"+ Nuevo cumpleaños\".",
          "Elige el miembro, la fecha y el canal donde se va a publicar el saludo. Si pones el año, se muestra cuántos cumple.",
          "Hubbert publica la felicitación automáticamente el día que corresponde, según la zona horaria del servidor.",
          "Con más de 10 cumpleaños la lista se agrupa por mes, empezando por el actual, y puedes buscar por nombre.",
          "Con el toggle de cada cumpleaños lo pausas sin borrarlo.",
        ],
      },
      {
        slug: "roles",
        title: "Roles por reacción",
        summary: "Los miembros se asignan roles reaccionando con un emoji.",
        steps: [
          "Ve a Roles y haz clic en \"+ Nuevo panel\".",
          "Agrega cada emoji con el rol que entrega (máximo 20) y elige el canal. Se publica al guardar y el bot pone las reacciones.",
          "Modo múltiple: cada miembro puede tener varios roles del panel. Modo único: al reaccionar con otro emoji se le quita el rol anterior.",
          "Puedes editar un panel publicado (texto, color, imagen, emojis, remitente). Si cambias el remitente o el canal, el panel se republica.",
          "Quitar la reacción quita el rol. El rol de Hubbert tiene que estar por encima de los roles que va a asignar (Configuración del servidor → Roles).",
        ],
      },
      {
        slug: "tickets",
        title: "Tickets",
        summary: "Canales privados de soporte que los miembros abren con un botón.",
        steps: [
          "En Tickets, tab Paneles, haz clic en \"+ Nuevo panel\".",
          "Completa título, descripción, texto del botón y el canal. Se publica al guardar.",
          "Elige qué roles atienden los tickets y cuáles pueden abrirlos, por ejemplo un panel de @kpop que solo vean los admins y @kpop.",
          "Al hacer clic en el botón se crea un canal privado, visible solo para esa persona, el staff del panel y los administradores. Cada miembro puede tener un ticket abierto por panel.",
          "En la tab Tickets ves los abiertos y los cerrados con su contador. Desde ahí puedes ir al canal o cerrarlo; dentro de Discord también se cierra con el botón \"Cerrar ticket\".",
          "La conversación queda en Discord: el panel solo muestra quién, cuándo y el estado.",
        ],
      },
    ],
  },
  {
    label: "Servidor",
    sections: [
      {
        slug: "settings",
        title: "Configuración",
        summary: "Zona horaria, canal por defecto y categoría de tickets.",
        steps: [
          "Define la zona horaria del servidor: se usa para decidir a qué hora local se envían las felicitaciones de cumpleaños.",
          "Elige un canal por defecto para los cumpleaños y recordatorios que no tengan uno propio. Con \"Enviar mensaje de prueba\" confirmas que el bot puede escribir ahí.",
          "Elige la categoría donde se crean los canales de los tickets.",
        ],
      },
      {
        slug: "donaciones",
        title: "Donaciones",
        summary: "Apoya el desarrollo de Hubbert.",
        steps: [
          "Ve a Donaciones para ver los montos sugeridos.",
          "Dona con Mercado Pago desde el botón de la página.",
        ],
      },
    ],
  },
];

// Cómo y cuándo usar cada comando; la descripción corta viene de DISCORD_COMMANDS.
const COMMAND_DETAILS: Record<string, string> = {
  blist: "Publica en el canal la lista completa de cumpleaños registrados en el servidor.",
  rlist: "Publica en el canal los recordatorios registrados, con la fecha y cuánto falta.",
  dashboard: "Te da el link del panel para agregar el servidor y gestionar cumpleaños, recordatorios y todo lo demás.",
  help: "Muestra en Discord la lista de comandos disponibles.",
};

function Chevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-90"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export default async function AyudaPage({
  params,
  searchParams,
}: {
  params: Promise<{ guildId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { guildId } = await params;
  const tab = (await searchParams).tab === "comandos" ? "comandos" : "uso";
  const base = `/servers/${guildId}/ayuda`;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Ayuda</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Casi todo se configura desde este panel. En Discord solo se usan unos pocos comandos.
        </p>
      </div>

      <LinkTabs
        active={tab}
        tabs={[
          { id: "uso", label: "Cómo usar", href: base },
          {
            id: "comandos",
            label: "Comandos",
            href: `${base}?tab=comandos`,
            badge: <CountBadge count={DISCORD_COMMANDS.length} />,
          },
        ]}
      />

      {tab === "uso" &&
        GROUPS.map((group) => (
          <section key={group.label} className="flex flex-col gap-2">
            <p className="px-1 font-mono text-[10px] tracking-[0.16em] text-zinc-400 uppercase dark:text-zinc-500">
              {group.label}
            </p>
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
              {group.sections.map((section) => (
                <details
                  key={section.slug}
                  id={section.slug}
                  className="group border-t border-zinc-200 first:border-t-0 dark:border-zinc-800"
                >
                  <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 select-none [&::-webkit-details-marker]:hidden">
                    <Chevron />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{section.title}</p>
                      <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{section.summary}</p>
                    </div>
                    <span className="text-xs text-zinc-400 tabular-nums dark:text-zinc-500">
                      {section.steps.length} pasos
                    </span>
                  </summary>
                  <div className="flex flex-col gap-4 border-t border-zinc-200 bg-zinc-50/60 py-4 pr-4 pl-10 dark:border-zinc-800 dark:bg-black/20">
                    <ol className="flex flex-col gap-2.5 text-sm text-zinc-600 dark:text-zinc-300">
                      {section.steps.map((step, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[11px] font-semibold text-accent tabular-nums">
                            {i + 1}
                          </span>
                          <span className="min-w-0">{step}</span>
                        </li>
                      ))}
                    </ol>
                    <Link
                      href={`/servers/${guildId}/${section.slug}`}
                      className="w-fit rounded-lg border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    >
                      Ir a {section.title} →
                    </Link>
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}

      {tab === "comandos" && (
        <>
          <ul className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            {DISCORD_COMMANDS.map((cmd) => (
              <li
                key={cmd.name}
                className="flex flex-col gap-1.5 border-t border-zinc-200 px-4 py-3.5 first:border-t-0 sm:flex-row sm:items-start sm:gap-4 dark:border-zinc-800"
              >
                <code className="w-fit shrink-0 rounded-md bg-accent/10 px-2 py-0.5 font-mono text-sm font-medium text-accent sm:w-28">
                  /{cmd.name}
                </code>
                <div className="min-w-0">
                  <p className="text-sm text-zinc-900 dark:text-zinc-50">{cmd.description}</p>
                  {COMMAND_DETAILS[cmd.name] && (
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{COMMAND_DETAILS[cmd.name]}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Automático, sin comando</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              El día 1 de cada mes Hubbert publica los cumpleaños de ese mes en el canal por defecto. Configúralo en{" "}
              <Link href={`/servers/${guildId}/settings`} className="font-medium text-accent hover:underline">
                Configuración
              </Link>
              .
            </p>
          </div>
        </>
      )}
    </div>
  );
}
