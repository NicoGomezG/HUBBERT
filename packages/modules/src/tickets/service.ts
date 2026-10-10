import { randomUUID } from "node:crypto";
import { prisma } from "@hubbert/db";
import {
  buildButtonRow,
  buildDiscordEmbed,
  createTicketChannel,
  deleteChannel,
  deleteMessage,
  fetchAssignableRoles,
  fetchGuildCategories,
  fetchGuildManageRoles,
  sendMessageToChannel,
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

export async function createPanel(guildId: string, userId: string, input: TicketPanelInput) {
  // Los ids vienen del cliente: se confirma que sean roles/categorías de esta guild.
  const [roles, categories] = await Promise.all([fetchAssignableRoles(guildId), fetchGuildCategories(guildId)]);
  const roleIds = new Set(roles.map((r) => r.id));
  if ([...input.staffRoleIds, ...input.requiredRoleIds].some((id) => !roleIds.has(id))) {
    throw new TicketPanelValidationError("Uno de los roles elegidos ya no existe en el servidor.");
  }
  if (input.categoryId && !categories.some((c) => c.id === input.categoryId)) {
    throw new TicketPanelValidationError("La categoría elegida ya no existe en el servidor.");
  }

  const panelId = randomUUID();
  const color = input.color ?? 0x5865f2;
  const embed = buildDiscordEmbed({ title: input.title, description: input.description, color });

  const message = await sendMessageToChannel(input.channelId, {
    embeds: [embed],
    components: [
      buildButtonRow({
        customId: `${OPEN_TICKET_CUSTOM_ID_PREFIX}${panelId}`,
        label: input.buttonLabel,
        style: input.buttonStyle,
        emoji: input.buttonEmoji,
      }),
    ],
  });

  return prisma.ticketPanel.create({
    data: {
      id: panelId,
      guildId,
      channelId: input.channelId,
      messageId: message.id,
      title: input.title,
      description: input.description,
      color,
      buttonLabel: input.buttonLabel,
      buttonEmoji: input.buttonEmoji,
      buttonStyle: input.buttonStyle,
      welcomeMessage: input.welcomeMessage,
      staffRoleIds: [...new Set(input.staffRoleIds)],
      requiredRoleIds: [...new Set(input.requiredRoleIds)],
      categoryId: input.categoryId,
      createdBy: userId,
    },
  });
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
    await sendMessageToChannel(channel.id, {
      embeds: [embed],
      components: [
        buildButtonRow({ customId: CLOSE_TICKET_CUSTOM_ID, label: "Cerrar ticket", style: "danger", emoji: "🔒" }),
      ],
    });

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
