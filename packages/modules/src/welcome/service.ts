import { prisma } from "@hubbert/db";
import {
  buildDiscordEmbed,
  buildLinkButtonRow,
  fetchGuildSummary,
  fetchGuildTextChannels,
  sendDirectMessage,
  sendMessageToChannel,
  sendWebhookMessage,
  userAvatarUrl,
  type DiscordUserInfo,
} from "@hubbert/discord";
import {
  CARD_SUBTITLE_DEFAULT,
  CARD_TITLE_DEFAULT,
  GOODBYE_MESSAGE_DEFAULT,
  HUBBERT_PROMO_BUTTONS,
  HUBBERT_PROMO_FIELDS,
  WELCOME_MESSAGE_DEFAULT,
  WELCOME_TITLE_DEFAULT,
  renderWelcomeMessage,
} from "./message";
import { buildWelcomeCardUrl } from "./card";
import type { WelcomeSettingsInput } from "./schema";

export class WelcomeValidationError extends Error {}

const HUBBERT_COLOR = 0x5865f2;

export interface WelcomeMember extends DiscordUserInfo {
  /** Apodo en el servidor, si tiene. */
  nick?: string | null;
}

function displayNameOf(member: WelcomeMember): string {
  return member.nick ?? member.globalName ?? member.username;
}

/** Devuelve la configuración guardada o los valores por defecto (sin crear la fila). */
export async function getWelcomeSettings(guildId: string) {
  const settings = await prisma.welcomeSettings.findUnique({ where: { guildId } });
  return (
    settings ?? {
      guildId,
      welcomeEnabled: false,
      welcomeChannelId: null,
      welcomeTitle: WELCOME_TITLE_DEFAULT,
      welcomeMessage: WELCOME_MESSAGE_DEFAULT,
      welcomeColor: HUBBERT_COLOR,
      welcomeImageUrl: null,
      showAvatar: true,
      pingMember: true,
      cardEnabled: false,
      cardBackgroundUrl: null,
      cardTitle: CARD_TITLE_DEFAULT,
      cardSubtitle: CARD_SUBTITLE_DEFAULT,
      cardTextColor: 0xffffff,
      senderName: null,
      senderAvatarUrl: null,
      goodbyeEnabled: false,
      goodbyeMessage: GOODBYE_MESSAGE_DEFAULT,
    }
  );
}

export async function updateWelcomeSettings(guildId: string, input: WelcomeSettingsInput) {
  if (input.welcomeChannelId) {
    const channels = await fetchGuildTextChannels(guildId);
    if (!channels.some((c) => c.id === input.welcomeChannelId)) {
      throw new WelcomeValidationError("El canal elegido no pertenece a este servidor.");
    }
  }

  return prisma.welcomeSettings.upsert({
    where: { guildId },
    create: { guildId, ...input },
    update: input,
  });
}

/**
 * `force` lo usa el botón "Probar" del dashboard: manda aunque la bienvenida
 * esté desactivada. El gateway lo llama sin `force`.
 */
export async function sendWelcome(guildId: string, member: WelcomeMember, { force = false } = {}) {
  const settings = await prisma.welcomeSettings.findUnique({ where: { guildId } });
  if (!settings || (!settings.welcomeEnabled && !force)) return null;
  if (!settings.welcomeChannelId) throw new WelcomeValidationError("Primero elige el canal de bienvenida y guarda.");

  const guild = await fetchGuildSummary(guildId);
  const description = renderWelcomeMessage(settings.welcomeMessage, {
    discordUserId: member.id,
    displayName: displayNameOf(member),
    guildName: guild.name,
    memberCount: guild.memberCount,
  });

  // Con la tarjeta activa, el avatar ya va dentro de la imagen: no se repite como thumbnail.
  const cardUrl = settings.cardEnabled
    ? buildWelcomeCardUrl({
        guildId,
        userId: member.id,
        avatar: member.avatar ?? "",
        displayName: displayNameOf(member),
        memberCount: guild.memberCount != null ? String(guild.memberCount) : "",
        version: String(settings.updatedAt.getTime()),
      })
    : null;

  const embed = buildDiscordEmbed({
    title: settings.welcomeTitle,
    description,
    color: settings.welcomeColor ?? HUBBERT_COLOR,
    thumbnailUrl: settings.showAvatar && !cardUrl ? userAvatarUrl(member) : null,
    imageUrl: cardUrl ?? settings.welcomeImageUrl,
  });

  // Las menciones dentro de un embed no notifican: para que le llegue el ping
  // la mención tiene que ir en el contenido del mensaje.
  const body = {
    content: settings.pingMember ? `<@${member.id}>` : undefined,
    embeds: [embed],
    allowed_mentions: { users: settings.pingMember ? [member.id] : [] },
  };

  return settings.senderName || settings.senderAvatarUrl
    ? sendWebhookMessage(settings.welcomeChannelId, body, {
        username: settings.senderName,
        avatarUrl: settings.senderAvatarUrl,
      })
    : sendMessageToChannel(settings.welcomeChannelId, body);
}

/**
 * La despedida va por DM a quien salió: saludo editable por el servidor + el
 * bloque fijo de Hubbert. Si Discord rechaza el DM (50007) el error sube y el
 * caller decide si ignorarlo.
 */
export async function sendGoodbye(guildId: string, member: WelcomeMember, { force = false } = {}) {
  const settings = await prisma.welcomeSettings.findUnique({ where: { guildId } });
  if (!settings || (!settings.goodbyeEnabled && !force)) return null;

  const guild = await fetchGuildSummary(guildId);
  const greeting = renderWelcomeMessage(settings.goodbyeMessage, {
    discordUserId: member.id,
    displayName: displayNameOf(member),
    guildName: guild.name,
    memberCount: guild.memberCount,
  });

  const embed = buildDiscordEmbed({
    title: "👋 ¡Hasta pronto!",
    description: greeting,
    color: HUBBERT_COLOR,
    footerText: `Saliste de ${guild.name}`,
    fields: HUBBERT_PROMO_FIELDS,
  });

  return sendDirectMessage(member.id, {
    embeds: [embed],
    components: [buildLinkButtonRow(HUBBERT_PROMO_BUTTONS)],
  });
}
