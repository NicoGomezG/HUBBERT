import { prisma } from "@hubbert/db";
import {
  addMemberRole,
  addReaction,
  buildDiscordEmbed,
  deleteMessage,
  editMessage,
  editWebhookMessage,
  fetchAssignableRoles,
  parseEmoji,
  parseGatewayEmoji,
  removeAllReactionsForEmoji,
  removeMemberRole,
  removeUserReaction,
  sendMessageToChannel,
  sendWebhookMessage,
} from "@hubbert/discord";
import { REACTION_ROLE_MODES, type ReactionRolePanelInput } from "./schema";

type APIEmbed = ReturnType<typeof buildDiscordEmbed>;

export class ReactionRolePanelNotFoundError extends Error {}
export class ReactionRoleValidationError extends Error {}

const ROLE_CHANGE_REASON = "Rol por reacción (Hubbert)";

const MODE_FOOTERS = Object.fromEntries(REACTION_ROLE_MODES.map((m) => [m.value, m.footer])) as Record<
  ReactionRolePanelInput["mode"],
  string
>;

export function listReactionRolePanels(guildId: string) {
  return prisma.reactionRolePanel.findMany({
    where: { guildId },
    include: { options: { orderBy: { position: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getReactionRolePanel(guildId: string, panelId: string) {
  const panel = await prisma.reactionRolePanel.findFirst({
    where: { id: panelId, guildId },
    include: { options: { orderBy: { position: "asc" } } },
  });
  if (!panel) throw new ReactionRolePanelNotFoundError();
  return panel;
}

/** Usado por el gateway para descartar rápido las reacciones que no son de un panel. */
export async function listReactionRolePanelMessageIds(): Promise<string[]> {
  const panels = await prisma.reactionRolePanel.findMany({ select: { messageId: true } });
  return panels.map((p) => p.messageId);
}

async function assertRolesAssignable(guildId: string, input: ReactionRolePanelInput) {
  const roles = new Map((await fetchAssignableRoles(guildId)).map((r) => [r.id, r]));
  for (const option of input.options) {
    const role = roles.get(option.roleId);
    if (!role) throw new ReactionRoleValidationError("Uno de los roles elegidos ya no existe o no se puede asignar.");
    if (!role.assignable) {
      throw new ReactionRoleValidationError(
        `El rol @${role.name} está por encima del rol del bot. En Configuración del servidor → Roles, arrastra el rol de Hubbert más arriba que los roles que va a asignar.`
      );
    }
  }
}

function buildPanelEmbed(input: ReactionRolePanelInput): APIEmbed {
  const lines = input.options.map((o) => `${o.emoji.display} — <@&${o.roleId}>${o.label ? ` · ${o.label}` : ""}`);
  const description = [input.description, lines.join("\n")].filter(Boolean).join("\n\n");
  if (description.length > 4096) {
    throw new ReactionRoleValidationError("La descripción más la lista de roles supera los 4096 caracteres.");
  }

  return buildDiscordEmbed({
    title: input.title,
    description,
    color: input.color ?? 0x5865f2,
    imageUrl: input.imageUrl,
    footerText: MODE_FOOTERS[input.mode],
  });
}

function usesWebhook(sender: { senderName: string | null; senderAvatarUrl: string | null }) {
  return Boolean(sender.senderName || sender.senderAvatarUrl);
}

/** Publica el panel (como el bot o por webhook) y le pone las reacciones. Si algo falla, no deja el mensaje a medias. */
async function publishPanelMessage(input: ReactionRolePanelInput, embed: APIEmbed): Promise<string> {
  const body = { embeds: [embed], allowed_mentions: { parse: [] } };
  const message = usesWebhook(input)
    ? await sendWebhookMessage(input.channelId, body, { username: input.senderName, avatarUrl: input.senderAvatarUrl })
    : await sendMessageToChannel(input.channelId, body);

  try {
    for (const option of input.options) {
      await addReaction(input.channelId, message.id, option.emoji.reactionId);
    }
  } catch (err) {
    await deleteMessage(input.channelId, message.id).catch(() => {});
    throw err;
  }
  return message.id;
}

function panelData(input: ReactionRolePanelInput) {
  return {
    channelId: input.channelId,
    title: input.title,
    description: input.description,
    color: input.color ?? 0x5865f2,
    imageUrl: input.imageUrl,
    mode: input.mode,
    senderName: input.senderName,
    senderAvatarUrl: input.senderAvatarUrl,
  };
}

function optionsData(input: ReactionRolePanelInput) {
  return input.options.map((o, position) => ({
    emoji: o.emoji.display,
    emojiKey: o.emoji.key,
    roleId: o.roleId,
    label: o.label,
    position,
  }));
}

export async function createReactionRolePanel(guildId: string, userId: string, input: ReactionRolePanelInput) {
  await assertRolesAssignable(guildId, input);
  const embed = buildPanelEmbed(input);
  const messageId = await publishPanelMessage(input, embed);

  try {
    return await prisma.reactionRolePanel.create({
      data: {
        ...panelData(input),
        guildId,
        messageId,
        createdBy: userId,
        options: { create: optionsData(input) },
      },
    });
  } catch (err) {
    await deleteMessage(input.channelId, messageId).catch(() => {});
    throw err;
  }
}

/**
 * Discord no deja cambiar el nombre/avatar de un mensaje ya enviado, así que si
 * cambia el remitente o el canal se republica el panel (messageId nuevo). Si no,
 * se edita el mismo mensaje y solo se sincronizan las reacciones que cambiaron.
 * Los roles que los miembros ya tienen no se tocan en ningún caso.
 */
export async function updateReactionRolePanel(guildId: string, panelId: string, input: ReactionRolePanelInput) {
  const existing = await getReactionRolePanel(guildId, panelId);
  await assertRolesAssignable(guildId, input);
  const embed = buildPanelEmbed(input);

  const mustRepublish =
    existing.channelId !== input.channelId ||
    existing.senderName !== input.senderName ||
    existing.senderAvatarUrl !== input.senderAvatarUrl;

  let messageId = existing.messageId;
  let editedInPlace = false;

  if (!mustRepublish) {
    const body = { embeds: [embed], allowed_mentions: { parse: [] } };
    try {
      if (usesWebhook(existing)) await editWebhookMessage(existing.channelId, existing.messageId, body);
      else await editMessage(existing.channelId, existing.messageId, body);
      editedInPlace = true;
    } catch {
      // El mensaje o el webhook fueron borrados a mano en Discord: se republica.
    }
  }

  if (editedInPlace) {
    const newKeys = new Set(input.options.map((o) => o.emoji.key));
    const oldKeys = new Set(existing.options.map((o) => o.emojiKey));

    for (const option of existing.options.filter((o) => !newKeys.has(o.emojiKey))) {
      const emoji = parseEmoji(option.emoji);
      if (emoji) {
        await removeAllReactionsForEmoji(existing.channelId, messageId, emoji.reactionId).catch(() => {});
      }
    }
    for (const option of input.options.filter((o) => !oldKeys.has(o.emoji.key))) {
      await addReaction(existing.channelId, messageId, option.emoji.reactionId);
    }
  } else {
    messageId = await publishPanelMessage(input, embed);
    await deleteMessage(existing.channelId, existing.messageId).catch(() => {});
  }

  return prisma.$transaction(async (tx) => {
    await tx.reactionRoleOption.deleteMany({ where: { panelId } });
    return tx.reactionRolePanel.update({
      where: { id: panelId },
      data: { ...panelData(input), messageId, options: { create: optionsData(input) } },
    });
  });
}

export async function deleteReactionRolePanel(guildId: string, panelId: string) {
  const panel = await getReactionRolePanel(guildId, panelId);

  try {
    await deleteMessage(panel.channelId, panel.messageId);
  } catch {
    // El mensaje ya pudo haber sido borrado a mano en Discord — no bloquea el borrado de la fila.
  }

  await prisma.reactionRolePanel.delete({ where: { id: panelId } });
}

export interface ReactionEvent {
  guildId: string;
  channelId: string;
  messageId: string;
  userId: string;
  emoji: { id: string | null; name: string | null };
  /** Solo viene en MESSAGE_REACTION_ADD. */
  memberRoleIds?: string[];
}

function findPanelByMessage(guildId: string, messageId: string) {
  return prisma.reactionRolePanel.findFirst({ where: { guildId, messageId }, include: { options: true } });
}

export async function handleReactionAdd(event: ReactionEvent): Promise<void> {
  const emoji = parseGatewayEmoji(event.emoji);
  if (!emoji) return;

  const panel = await findPanelByMessage(event.guildId, event.messageId);
  if (!panel) return;

  const option = panel.options.find((o) => o.emojiKey === emoji.key);
  if (!option) {
    // Emoji ajeno al panel: se quita para que el panel no se llene de reacciones sueltas.
    await removeUserReaction(event.channelId, event.messageId, emoji.reactionId, event.userId).catch(() => {});
    return;
  }

  await addMemberRole(event.guildId, event.userId, option.roleId, ROLE_CHANGE_REASON);

  if (panel.mode !== "single") return;

  const memberRoles = new Set(event.memberRoleIds ?? []);
  const previous = panel.options.filter((o) => o.id !== option.id && memberRoles.has(o.roleId));

  await Promise.all(
    previous.map(async (o) => {
      await removeMemberRole(event.guildId, event.userId, o.roleId, ROLE_CHANGE_REASON);
      // Quitar la reacción anterior dispara un MESSAGE_REACTION_REMOVE que vuelve a
      // quitar el mismo rol — es idempotente, así que no hace falta ignorarlo.
      const previousEmoji = parseEmoji(o.emoji);
      if (previousEmoji) {
        await removeUserReaction(event.channelId, event.messageId, previousEmoji.reactionId, event.userId).catch(
          () => {}
        );
      }
    })
  );
}

export async function handleReactionRemove(event: ReactionEvent): Promise<void> {
  const emoji = parseGatewayEmoji(event.emoji);
  if (!emoji) return;

  const panel = await findPanelByMessage(event.guildId, event.messageId);
  const option = panel?.options.find((o) => o.emojiKey === emoji.key);
  if (!option) return;

  await removeMemberRole(event.guildId, event.userId, option.roleId, ROLE_CHANGE_REASON);
}
