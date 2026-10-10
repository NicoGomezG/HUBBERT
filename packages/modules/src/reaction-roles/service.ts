import { prisma } from "@hubbert/db";
import {
  addMemberRole,
  addReaction,
  buildDiscordEmbed,
  deleteMessage,
  fetchAssignableRoles,
  parseEmoji,
  parseGatewayEmoji,
  removeMemberRole,
  removeUserReaction,
  sendMessageToChannel,
} from "@hubbert/discord";
import type { ReactionRolePanelInput } from "./schema";

export class ReactionRolePanelNotFoundError extends Error {}
export class ReactionRoleValidationError extends Error {}

const ROLE_CHANGE_REASON = "Rol por reacción (Hubbert)";

const MODE_FOOTERS: Record<ReactionRolePanelInput["mode"], string> = {
  multiple: "Reacciona para obtener un rol · quita tu reacción para sacártelo",
  single: "Solo puedes tener uno de estos roles a la vez",
};

export function listReactionRolePanels(guildId: string) {
  return prisma.reactionRolePanel.findMany({
    where: { guildId },
    include: { options: { orderBy: { position: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getReactionRolePanel(guildId: string, panelId: string) {
  const panel = await prisma.reactionRolePanel.findFirst({ where: { id: panelId, guildId } });
  if (!panel) throw new ReactionRolePanelNotFoundError();
  return panel;
}

/** Usado por el gateway para descartar rápido las reacciones que no son de un panel. */
export async function listReactionRolePanelMessageIds(): Promise<string[]> {
  const panels = await prisma.reactionRolePanel.findMany({ select: { messageId: true } });
  return panels.map((p) => p.messageId);
}

export async function createReactionRolePanel(guildId: string, userId: string, input: ReactionRolePanelInput) {
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

  const lines = input.options.map((o) => `${o.emoji.display} — <@&${o.roleId}>${o.label ? ` · ${o.label}` : ""}`);
  const description = [input.description, lines.join("\n")].filter(Boolean).join("\n\n");
  if (description.length > 4096) {
    throw new ReactionRoleValidationError("La descripción más la lista de roles supera los 4096 caracteres.");
  }

  const color = input.color ?? 0x5865f2;
  const embed = buildDiscordEmbed({ title: input.title, description, color, footerText: MODE_FOOTERS[input.mode] });

  const message = await sendMessageToChannel(input.channelId, { embeds: [embed], allowed_mentions: { parse: [] } });

  try {
    for (const option of input.options) {
      await addReaction(input.channelId, message.id, option.emoji.reactionId);
    }

    return await prisma.reactionRolePanel.create({
      data: {
        guildId,
        channelId: input.channelId,
        messageId: message.id,
        title: input.title,
        description: input.description,
        color,
        mode: input.mode,
        createdBy: userId,
        options: {
          create: input.options.map((o, position) => ({
            emoji: o.emoji.display,
            emojiKey: o.emoji.key,
            roleId: o.roleId,
            label: o.label,
            position,
          })),
        },
      },
    });
  } catch (err) {
    await deleteMessage(input.channelId, message.id).catch(() => {});
    throw err;
  }
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
