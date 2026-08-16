import type { APIEmbed } from "discord-api-types/v10";

export interface EmbedFieldInput {
  name: string;
  value: string;
  inline: boolean;
}

export interface EmbedInput {
  title?: string | null;
  description?: string | null;
  url?: string | null;
  color?: number | null;
  authorName?: string | null;
  authorUrl?: string | null;
  authorIconUrl?: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  footerText?: string | null;
  footerIconUrl?: string | null;
  showTimestamp?: boolean;
  fields?: EmbedFieldInput[];
}

// Límites reales de la API de Discord para un embed.
export const EMBED_LIMITS = {
  title: 256,
  description: 4096,
  fieldName: 256,
  fieldValue: 1024,
  footerText: 2048,
  authorName: 256,
  maxFields: 25,
} as const;

export function validateEmbedInput(input: EmbedInput): string[] {
  const errors: string[] = [];

  if (input.title && input.title.length > EMBED_LIMITS.title)
    errors.push(`El título supera ${EMBED_LIMITS.title} caracteres.`);
  if (input.description && input.description.length > EMBED_LIMITS.description)
    errors.push(`La descripción supera ${EMBED_LIMITS.description} caracteres.`);
  if (input.footerText && input.footerText.length > EMBED_LIMITS.footerText)
    errors.push(`El footer supera ${EMBED_LIMITS.footerText} caracteres.`);
  if (input.authorName && input.authorName.length > EMBED_LIMITS.authorName)
    errors.push(`El nombre del autor supera ${EMBED_LIMITS.authorName} caracteres.`);
  if (input.fields && input.fields.length > EMBED_LIMITS.maxFields)
    errors.push(`Un embed admite máximo ${EMBED_LIMITS.maxFields} fields.`);

  for (const [i, field] of (input.fields ?? []).entries()) {
    if (!field.name?.trim()) errors.push(`Field #${i + 1}: el nombre no puede estar vacío.`);
    if (!field.value?.trim()) errors.push(`Field #${i + 1}: el valor no puede estar vacío.`);
    if (field.name?.length > EMBED_LIMITS.fieldName)
      errors.push(`Field #${i + 1}: el nombre supera ${EMBED_LIMITS.fieldName} caracteres.`);
    if (field.value?.length > EMBED_LIMITS.fieldValue)
      errors.push(`Field #${i + 1}: el valor supera ${EMBED_LIMITS.fieldValue} caracteres.`);
  }

  const hasContent =
    input.title || input.description || (input.fields && input.fields.length > 0) || input.imageUrl;
  if (!hasContent) errors.push("El embed necesita al menos título, descripción, un field o una imagen.");

  return errors;
}

export function buildDiscordEmbed(input: EmbedInput): APIEmbed {
  const embed: APIEmbed = {
    title: input.title ?? undefined,
    description: input.description ?? undefined,
    url: input.url ?? undefined,
    color: input.color ?? undefined,
  };

  if (input.authorName) {
    embed.author = {
      name: input.authorName,
      url: input.authorUrl ?? undefined,
      icon_url: input.authorIconUrl ?? undefined,
    };
  }
  if (input.imageUrl) embed.image = { url: input.imageUrl };
  if (input.thumbnailUrl) embed.thumbnail = { url: input.thumbnailUrl };
  if (input.footerText) {
    embed.footer = { text: input.footerText, icon_url: input.footerIconUrl ?? undefined };
  }
  if (input.showTimestamp) embed.timestamp = new Date().toISOString();
  if (input.fields?.length) {
    embed.fields = input.fields.map((f) => ({ name: f.name, value: f.value, inline: f.inline }));
  }

  return embed;
}
