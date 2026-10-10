// Límite real de Discord: reacciones distintas por mensaje.
export const REACTION_ROLE_MAX_OPTIONS = 20;

export const REACTION_ROLE_MODES = [
  {
    value: "multiple",
    label: "Múltiple",
    description: "Cada miembro puede tener varios roles del panel.",
    footer: "Reacciona para obtener un rol · quita tu reacción para sacártelo",
  },
  {
    value: "single",
    label: "Único",
    description: "Al elegir un rol se le quitan los demás del panel.",
    footer: "Solo puedes tener uno de estos roles a la vez",
  },
] as const;
