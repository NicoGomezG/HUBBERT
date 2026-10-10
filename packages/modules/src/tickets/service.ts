import { randomUUID } from "node:crypto";
import { prisma } from "@hubbert/db";
import {
  buildButtonRow,
  buildDiscordEmbed,
  createTicketChannel,
  deleteChannel,
  deleteMessage,
  editMessage,
  editWebhookMessage,
  fetchAssignableRoles,
  fetchGuildCategories,
  fetchGuildManageRoles,
  sendMessageToChannel,
  sendWebhookMessage,
} from "@hubbert/discord";
import { getGuildSettings } from "../settings/service";
import { TICKET_WELCOME_DEFAULT, renderTicketWelcomeMessage } from "./message";
import type { TicketPanelInput } from "./schema";

export class TicketPanelNotFoundError extends Error {}
export class TicketNotFoundError extends Error {}
export class TicketForbiddenError extends Error {}
export class TicketPanelValidationError extends Error {}
export class TicketAlreadyOpenError extends Error {
  constructor(public channelId: string) {
    super("Ya hay un ticket abierto para este usuario.");
  }
}
export class TicketMissingRoleError extends Error {
  constructor(public requiredRoleIds: string[]) {
    super("El usuario no tiene ninguno de los roles requeridos por el panel.");
  }
}

/** Quién está apretando el botón: viene del `member` de la interacción. */
export interface TicketRequester {
  discordUserId: string;
  displayName: string;
  roleIds: string[];
  hasManageAccess: boolean;
}

const OPEN_TICKET_CUSTOM_ID_PREFIX = "ticket_open:";
export const CLOSE_TICKET_CUSTOM_ID = "ticket_close";

export function parseOpenTicketCustomId(customId: string): string | null {
  return customId.startsWith(OPEN_TICKET_CUSTOM_ID_PREFIX)
    ? customId.slice(OPEN_TICKET_CUSTOM_ID_PREFIX.length)
    : null;
}

function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "usuario";
}

export function listPanels(guildId: string) {
  return prisma.ticketPanel.findMany({ where: { guildId }, orderBy: { createdAt: "desc" } });
}

export function listTickets(guildId: string) {
  return prisma.ticket.findMany({
    where: { guildId },
    include: { panel: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getPanel(guildId: string, panelId: string) {
  const panel = await prisma.ticketPanel.findFirst({ where: { id: panelId, guildId } });
  if (!panel) throw new TicketPanelNotFoundError();
  return panel;
}

// Los ids vienen del cliente: se confirma que sean roles/categorías de esta guild.
async function assertPanelReferences(guildId: string, input: TicketPanelInput) {
  const [roles, categories] = await Promise.all([fetchAssignableRoles(guildId), fetchGuildCategories(guildId)]);
  const roleIds = new Set(roles.map((r) => r.id));
  if ([...input.staffRoleIds, ...input.requiredRoleIds].some((id) => !roleIds.has(id))) {
    throw new TicketPanelValidationError("Uno de los roles elegidos ya no existe en el servidor.");
  }
  if (input.categoryId && !categories.some((c) => c.id === input.categoryId)) {
    throw new TicketPanelValidationError("La categoría elegida ya no existe en el servidor.");
  }
}

function usesWebhook(sender: { senderName: string | null; senderAvatarUrl: string | null }) {
  return Boolean(sender.senderName || sender.senderAvatarUrl);
}

function panelMessageBody(panelId: string, input: TicketPanelInput) {
  return {
    embeds: [
      buildDiscordEmbed({ title: input.title, description: input.description, color: input.color ?? 0x5865f2 }),
    ],
    components: [
      buildButtonRow({
        customId: `${OPEN_TICKET_CUSTOM_ID_PREFIX}${panelId}`,
        label: input.buttonLabel,
        style: input.buttonStyle,
        emoji: input.buttonEmoji,
      }),
    ],
  };
}

/**
 * Publica como el bot o por webhook. El webhook lo crea el bot, así que es
 * "propiedad de la aplicación" y Discord le permite llevar botones que
 * disparan interacciones.
 */
async function publishPanelMessage(panelId: string, input: TicketPanelInput): Promise<string> {
  const body = panelMessageBody(panelId, input);
  const message = usesWebhook(input)
    ? await sendWebhookMessage(input.channelId, body, { username: input.senderName, avatarUrl: input.senderAvatarUrl })
    : await sendMessageToChannel(input.channelId, body);
  return message.id;
}

function panelData(input: TicketPanelInput) {
  return {
    channelId: input.channelId,
    title: input.title,
    description: input.description,
    color: input.color ?? 0x5865f2,
    buttonLabel: input.buttonLabel,
    buttonEmoji: input.buttonEmoji,
    buttonStyle: input.buttonStyle,
    welcomeMessage: input.welcomeMessage,
    staffRoleIds: [...new Set(input.staffRoleIds)],
    requiredRoleIds: [...new Set(input.requiredRoleIds)],
    categoryId: input.categoryId,
    senderName: input.senderName,
    senderAvatarUrl: input.senderAvatarUrl,
  };
}

export async function createPanel(guildId: string, userId: string, input: TicketPanelInput) {
  await assertPanelReferences(guildId, input);

  const panelId = randomUUID();
  const messageId = await publishPanelMessage(panelId, input);

  try {
    return await prisma.ticketPanel.create({
      data: { ...panelData(input), id: panelId, guildId, messageId, createdBy: userId },
    });
  } catch (err) {
    await deleteMessage(input.channelId, messageId).catch(() => {});
    throw err;
  }
}

/**
 * Discord no deja cambiar el nombre/avatar de un mensaje ya enviado, así que si
 * cambia el remitente o el canal se republica el panel (messageId nuevo). Si no,
 * se edita el mismo mensaje. El botón conserva el mismo custom_id (el id del
 * panel), y los tickets ya abiertos no se tocan: los cambios de roles o
 * categoría aplican a los tickets nuevos.
 */
export async function updatePanel(guildId: string, panelId: string, input: TicketPanelInput) {
  const existing = await getPanel(guildId, panelId);
  await assertPanelReferences(guildId, input);

  const mustRepublish =
    existing.channelId !== input.channelId ||
    existing.senderName !== input.senderName ||
    existing.senderAvatarUrl !== input.senderAvatarUrl;

  let messageId = existing.messageId;
  let editedInPlace = false;

  if (!mustRepublish) {
    const body = panelMessageBody(panelId, input);
    try {
      if (usesWebhook(existing)) await editWebhookMessage(existing.channelId, existing.messageId, body);
      else await editMessage(existing.channelId, existing.messageId, body);
      editedInPlace = true;
    } catch {
      // El mensaje o el webhook fueron borrados a mano en Discord: se republica.
    }
  }

  if (!editedInPlace) {
    messageId = await publishPanelMessage(panelId, input);
    await deleteMessage(existing.channelId, existing.messageId).catch(() => {});
  }

  return prisma.ticketPanel.update({ where: { id: panelId }, data: { ...panelData(input), messageId } });
}

export async function deletePanel(guildId: string, panelId: string) {
  const panel = await getPanel(guildId, panelId);

  try {
    await deleteMessage(panel.channelId, panel.messageId);
  } catch {
    // El mensaje ya pudo haber sido borrado a mano en Discord — no bloquea el borrado de la fila.
  }

  await prisma.ticketPanel.delete({ where: { id: panelId } });
}

/** Un ticket abierto por usuario y por panel: puede tener uno de Soporte y otro de Reportes a la vez. */
export function findOpenTicketForUser(guildId: string, panelId: string, discordUserId: string) {
  return prisma.ticket.findFirst({ where: { guildId, panelId, discordUserId, status: "open" } });
}

export async function openTicket(guildId: string, panelId: string, requester: TicketRequester) {
  const { discordUserId, displayName } = requester;
  const panel = await getPanel(guildId, panelId); // valida que el panel pertenezca a esta guild

  // Los admins pueden abrir desde cualquier panel aunque no tengan el rol requerido.
  const hasRequiredRole =
    panel.requiredRoleIds.length === 0 || panel.requiredRoleIds.some((id) => requester.roleIds.includes(id));
  if (!hasRequiredRole && !requester.hasManageAccess) throw new TicketMissingRoleError(panel.requiredRoleIds);

  const existing = await findOpenTicketForUser(guildId, panelId, discordUserId);
  if (existing) throw new TicketAlreadyOpenError(existing.channelId);

  const [manageRoles, settings] = await Promise.all([fetchGuildManageRoles(guildId), getGuildSettings(guildId)]);

  const channel = await createTicketChannel({
    guildId,
    name: `ticket-${slugify(displayName)}`,
    parentId: panel.categoryId ?? settings.ticketCategoryId,
    allowUserId: discordUserId,
    allowRoleIds: [...new Set([...manageRoles.map((r) => r.id), ...panel.staffRoleIds])],
  });

  try {
    const ticket = await prisma.ticket.create({
      data: { guildId, panelId, channelId: channel.id, discordUserId, displayName },
    });

    const welcomeText = renderTicketWelcomeMessage(panel.welcomeMessage ?? TICKET_WELCOME_DEFAULT, {
      discordUserId,
      displayName,
    });
    const embed = buildDiscordEmbed({
      title: `${panel.buttonEmoji} Ticket abierto`,
      description: welcomeText,
      color: panel.color ?? 0x5865f2,
    });
    const welcomeBody = {
      embeds: [embed],
      components: [
        buildButtonRow({ customId: CLOSE_TICKET_CUSTOM_ID, label: "Cerrar ticket", style: "danger", emoji: "🔒" }),
      ],
    };
    // Con remitente personalizado se crea un webhook en el canal del ticket;
    // se borra solo junto con el canal al cerrar el ticket.
    if (usesWebhook(panel)) {
      await sendWebhookMessage(channel.id, welcomeBody, {
        username: panel.senderName,
        avatarUrl: panel.senderAvatarUrl,
      });
    } else {
      await sendMessageToChannel(channel.id, welcomeBody);
    }

    return ticket;
  } catch (err) {
    await deleteChannel(channel.id).catch(() => {});
    throw err;
  }
}

/**
 * `requesterHasManageAccess` viene precalculado por el caller (desde el
 * bitfield de Discord en la interacción, o desde `getGuildAccess` en el
 * dashboard) para no depender de una llamada extra a la API acá. Los roles
 * de staff del panel también pueden cerrar.
 */
export async function closeTicket(
  channelId: string,
  requesterId: string,
  requesterHasManageAccess: boolean,
  requesterRoleIds: string[] = []
) {
  const ticket = await prisma.ticket.findFirst({
    where: { channelId, status: "open" },
    include: { panel: { select: { staffRoleIds: true } } },
  });
  if (!ticket) throw new TicketNotFoundError();
  const isStaff = ticket.panel?.staffRoleIds.some((id) => requesterRoleIds.includes(id)) ?? false;
  if (ticket.discordUserId !== requesterId && !requesterHasManageAccess && !isStaff) throw new TicketForbiddenError();

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { status: "closed", closedAt: new Date(), closedByDiscordUserId: requesterId },
  });

  await deleteChannel(channelId);
  return ticket;
}
