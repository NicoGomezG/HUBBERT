import { DiscordAPIError } from "@discordjs/rest";

// Códigos de error de Discord más comunes al mandar mensajes.
// https://discord.com/developers/docs/topics/opcodes-and-status-codes#json
const KNOWN_ERROR_TIPS: Record<number, string> = {
  50001:
    'El bot no tiene acceso a ese canal. En Discord: click derecho al canal → Editar canal → Permisos, y confirmá que el rol del bot tenga "Ver canal" y "Enviar mensajes" habilitados ahí (puede estar restringido aunque el bot tenga permiso a nivel servidor).',
  50013:
    "Al bot le falta un permiso para hacer esto. Revisa sus permisos en Configuración de roles del servidor.",
  10003: "Ese canal ya no existe o fue eliminado.",
  50035: "Discord rechazó el contenido del mensaje (probablemente supera algún límite de tamaño).",
};

export function translateDiscordError(err: unknown): string {
  if (err instanceof DiscordAPIError) {
    const tip = KNOWN_ERROR_TIPS[Number(err.code)];
    return tip ? `${err.message}. ${tip}` : `Discord devolvió un error (${err.code}): ${err.message}`;
  }
  return err instanceof Error ? err.message : "Error desconocido al hablar con Discord.";
}
