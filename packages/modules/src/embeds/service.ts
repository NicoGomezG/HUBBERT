import { prisma } from "@hubbert/db";
import {
  buildDiscordEmbed,
  fetchGuildTextChannels,
  sendEmbedToChannel,
  validateEmbedInput,
  type DiscordTextChannel,
} from "@hubbert/discord";
import type { EmbedInputPayload } from "./schema";

export class EmbedNotFoundError extends Error {}
export class EmbedValidationError extends Error {
  constructor(public issues: string[]) {
    super(issues.join(" "));
  }
}

// Siempre filtrado por guildId — nunca se busca un embed solo por id.
export function listEmbeds(guildId: string) {
  return prisma.embed.findMany({
    where: { guildId },
    include: { fields: { orderBy: { position: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getEmbed(guildId: string, embedId: string) {
  const embed = await prisma.embed.findFirst({
    where: { id: embedId, guildId },
    include: { fields: { orderBy: { position: "asc" } } },
  });
  if (!embed) throw new EmbedNotFoundError();
  return embed;
}

export async function createEmbed(guildId: string, userId: string, input: EmbedInputPayload) {
  return prisma.embed.create({
    data: {
      guildId,
      createdBy: userId,
      name: input.name,
      title: input.title,
      description: input.description,
      url: input.url,
      color: input.color ?? null,
      authorName: input.authorName,
      authorUrl: input.authorUrl,
      authorIconUrl: input.authorIconUrl,
      imageUrl: input.imageUrl,
      thumbnailUrl: input.thumbnailUrl,
      footerText: input.footerText,
      footerIconUrl: input.footerIconUrl,
      showTimestamp: input.showTimestamp,
      fields: {
        create: input.fields.map((f, i) => ({ ...f, position: i })),
      },
    },
    include: { fields: true },
  });
}

export async function updateEmbed(
  guildId: string,
  embedId: string,
  input: EmbedInputPayload
) {
  await getEmbed(guildId, embedId); // 404 si no existe o es de otra guild

  return prisma.$transaction(async (tx) => {
    await tx.embedField.deleteMany({ where: { embedId } });
    return tx.embed.update({
      where: { id: embedId },
      data: {
        name: input.name,
        title: input.title,
        description: input.description,
        url: input.url,
        color: input.color ?? null,
        authorName: input.authorName,
        authorUrl: input.authorUrl,
        authorIconUrl: input.authorIconUrl,
        imageUrl: input.imageUrl,
        thumbnailUrl: input.thumbnailUrl,
        footerText: input.footerText,
        footerIconUrl: input.footerIconUrl,
        showTimestamp: input.showTimestamp,
        fields: {
          create: input.fields.map((f, i) => ({ ...f, position: i })),
        },
      },
      include: { fields: { orderBy: { position: "asc" } } },
    });
  });
}

export async function deleteEmbed(guildId: string, embedId: string) {
  await getEmbed(guildId, embedId);
  await prisma.embed.delete({ where: { id: embedId } });
}

export async function listSendableChannels(guildId: string): Promise<DiscordTextChannel[]> {
  return fetchGuildTextChannels(guildId);
}

export async function sendEmbed(guildId: string, embedId: string, channelId: string) {
  const embed = await getEmbed(guildId, embedId);

  const input = {
    title: embed.title,
    description: embed.description,
    url: embed.url,
    color: embed.color,
    authorName: embed.authorName,
    authorUrl: embed.authorUrl,
    authorIconUrl: embed.authorIconUrl,
    imageUrl: embed.imageUrl,
    thumbnailUrl: embed.thumbnailUrl,
    footerText: embed.footerText,
    footerIconUrl: embed.footerIconUrl,
    showTimestamp: embed.showTimestamp,
    fields: embed.fields.map((f) => ({ name: f.name, value: f.value, inline: f.inline })),
  };

  const errors = validateEmbedInput(input);
  if (errors.length > 0) throw new EmbedValidationError(errors);

  // El canal tiene que pertenecer a esta guild — evita usar el bot para
  // mandar mensajes a un canal de otro servidor pasando el id a mano.
  const channels = await fetchGuildTextChannels(guildId);
  if (!channels.some((c) => c.id === channelId)) {
    throw new EmbedValidationError(["El canal no pertenece a este servidor."]);
  }

  const message = await sendEmbedToChannel(channelId, buildDiscordEmbed(input));

  await prisma.embed.update({
    where: { id: embedId },
    data: { lastSentAt: new Date() },
  });

  return message;
}
