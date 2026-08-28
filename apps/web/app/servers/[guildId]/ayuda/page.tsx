const SECTIONS = [
  {
    title: "Embeds",
    steps: [
      "Ve a la pestaña Embeds y haz clic en \"+ Nuevo embed\".",
      "Completa título, descripción, color y los fields que quieras.",
      "Guarda el embed y elige a qué canal enviarlo.",
      "Puedes reenviarlo cuando quieras: queda guardado para reutilizarlo.",
    ],
  },
  {
    title: "Cumpleaños",
    steps: [
      "Ve a la pestaña Cumpleaños y haz clic en \"+ Nuevo cumpleaños\".",
      "Elige el usuario, la fecha y el canal donde se va a publicar el saludo.",
      "Hubbert publica el mensaje de felicitación automáticamente el día que corresponde.",
      "Puedes desactivar un cumpleaños sin borrarlo, o editarlo cuando quieras.",
    ],
  },
  {
    title: "Recordatorios",
    steps: [
      "Ve a la pestaña Recordatorios y haz clic en \"+ Nuevo recordatorio\".",
      "Completa un título, la fecha del evento y el canal donde se va a avisar.",
      "Elige con cuántos días de anticipación quieres el aviso, y si querés que sea diario (por ejemplo, para estudiar para una prueba) o una sola vez (por ejemplo, una reunión importante).",
      "Sirve para cualquier cosa más allá de cumpleaños: pruebas, reuniones, vencimientos, lo que necesites recordar.",
    ],
  },
  {
    title: "Tickets",
    steps: [
      "Ve a la pestaña Tickets y haz clic en \"+ Nuevo panel\".",
      "Completa título, descripción, texto del botón y el canal donde publicarlo — se publica al guardar.",
      "Cualquier miembro puede hacer clic en el botón del panel para abrir su ticket: se crea un canal privado, visible solo para esa persona y los roles con permiso de administrador.",
      "Desde dentro del canal, el creador del ticket o el staff pueden cerrarlo con el botón \"Cerrar ticket\" (borra el canal). También puedes cerrarlo desde el dashboard.",
      "El dashboard solo muestra metadata del ticket (quién, cuándo, estado) — la conversación en sí queda en Discord.",
    ],
  },
  {
    title: "Configuración",
    steps: [
      "Ve a la pestaña Configuración para definir la zona horaria del servidor.",
      "Elige un canal por defecto para los mensajes que no especifican uno propio.",
      "Estos ajustes aplican a todas las automatizaciones del bot en este servidor.",
    ],
  },
  {
    title: "Donaciones",
    steps: [
      "Ve a la pestaña Donaciones para apoyar el desarrollo de Hubbert.",
      "Encontrarás montos sugeridos y un botón para donar con Mercado Pago.",
    ],
  },
  {
    title: "Comandos de Discord",
    steps: [
      "Usa /blist en cualquier canal para ver la lista completa de cumpleaños registrados en el servidor.",
      "Usa /rlist en cualquier canal para ver la lista completa de recordatorios registrados en el servidor.",
      "Usa /dashboard para obtener el link del panel y agregar el servidor, cumpleaños o recordatorios.",
      "Usa /help para ver todos los comandos disponibles del bot.",
      "El día 1 de cada mes, Hubbert publica automáticamente los cumpleaños de ese mes en el canal por defecto (configúralo en la pestaña Configuración).",
    ],
  },
] as const;

export default function AyudaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Cómo usar Hubbert
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Casi todo se configura aquí, desde el panel. Solo /blist, /rlist, /dashboard y /help se usan directamente en Discord.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {SECTIONS.map((section) => (
          <div
            key={section.title}
            className="rounded-md border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {section.title}
            </h3>
            <ol className="flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-300">
              {section.steps.map((step, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-zinc-400 dark:text-zinc-600">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
