// Punto de entrada para componentes "use client": solo constantes sin
// dependencias. El index exporta servicios que importan Prisma y el cliente
// REST de Discord, y Next intentaría meterlos en el bundle del navegador.
export { TICKET_WELCOME_DEFAULT, TICKET_MESSAGE_VARIABLES } from "./tickets/message";
export { BIRTHDAY_MESSAGE_VARIABLES } from "./birthdays/message";
export { REMINDER_MESSAGE_VARIABLES } from "./reminders/message";
export { REACTION_ROLE_MODES, REACTION_ROLE_MAX_OPTIONS } from "./reaction-roles/constants";
