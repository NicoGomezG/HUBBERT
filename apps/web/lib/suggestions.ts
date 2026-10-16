export const SUGGESTION_CATEGORIES = {
  feature: { label: "Nueva función", emoji: "✨", color: 0x5865f2 },
  improvement: { label: "Mejora", emoji: "🛠️", color: 0x57f287 },
  bug: { label: "Error", emoji: "🐛", color: 0xed4245 },
  other: { label: "Otra", emoji: "💬", color: 0x99aab5 },
} as const;

export type SuggestionCategory = keyof typeof SUGGESTION_CATEGORIES;

export const SUGGESTION_TITLE_MAX = 100;
export const SUGGESTION_DESCRIPTION_MIN = 20;
export const SUGGESTION_DESCRIPTION_MAX = 1500;
