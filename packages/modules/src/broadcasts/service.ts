import { prisma, type Prisma } from "@hubbert/db";
import { fetchAssignableRoles, fetchMemberIdsWithRoles, sendDirectMessage } from "@hubbert/discord";
import { getEmbed, toDiscordEmbed } from "../embeds/service";
import type { BroadcastInput } from "./schema";

export class BroadcastValidationError extends Error {}

export const ACTIVE_BROADCAST_STATUSES = ["pending", "sending"];

export interface BroadcastCounts {
  pending: number;
  sent: number;
  closed: number;
  failed: number;
}

/** Últimos envíos del servidor con cuántos destinatarios hay en cada estado. */
export async function listBroadcasts(guildId: string) {
  const broadcasts = await prisma.dmBroadcast.findMany({
    where: { guildId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      embedName: true,
      roleNames: true,
      status: true,
      total: true,
      createdAt: true,
      finishedAt: true,
    },
  });

  const grouped = await prisma.dmBroadcastRecipient.groupBy({
    by: ["broadcastId", "status"],
    where: { broadcastId: { in: broadcasts.map((b) => b.id) } },
    _count: { _all: true },
  });

  return broadcasts.map((b) => {
    const counts: BroadcastCounts = { pending: 0, sent: 0, closed: 0, failed: 0 };
    for (const g of grouped) {
      if (g.broadcastId === b.id && g.status in counts) counts[g.status as keyof BroadcastCounts] = g._count._all;
    }
    return { ...b, counts };
  });
}

export async function countBroadcastRecipients(guildId: string, roleIds: string[]): Promise<number> {
  if (roleIds.length === 0) return 0;
  return (await fetchMemberIdsWithRoles(guildId, roleIds)).length;
}

/**
 * Deja el envío en cola: el gateway lo procesa después, de a un DM a la vez.
 * El embed y la lista de destinatarios se congelan acá.
 */
export async function createBroadcast(guildId: string, userId: string, input: BroadcastInput) {
  // Uno a la vez por servidor: dos envíos en paralelo duplican el ritmo de DMs del bot.
  const active = await prisma.dmBroadcast.count({
    where: { guildId, status: { in: ACTIVE_BROADCAST_STATUSES } },
  });
  if (active > 0) {
    throw new BroadcastValidationError("Ya hay un envío masivo en curso en este servidor. Espera a que termine o cancélalo.");
  }

  const embed = await getEmbed(guildId, input.embedId);
  const payload = toDiscordEmbed(embed);

  const roleIds = [...new Set(input.roleIds)];
  const roles = (await fetchAssignableRoles(guildId)).filter((r) => roleIds.includes(r.id));
  if (roles.length !== roleIds.length) {
    throw new BroadcastValidationError("Uno de los roles ya no existe en el servidor.");
  }

  const recipients = await fetchMemberIdsWithRoles(guildId, roleIds);
  if (recipients.length === 0) {
    throw new BroadcastValidationError("Ningún miembro tiene esos roles.");
  }

  return prisma.dmBroadcast.create({
    data: {
      guildId,
      createdBy: userId,
      embedId: embed.id,
      embedName: embed.name,
      payload: payload as Prisma.InputJsonValue,
      roleIds,
      roleNames: roles.map((r) => r.name),
      total: recipients.length,
      recipients: { createMany: { data: recipients.map((discordUserId) => ({ discordUserId })) } },
    },
  });
}

export async function cancelBroadcast(guildId: string, broadcastId: string) {
  await prisma.dmBroadcast.updateMany({
    where: { id: broadcastId, guildId, status: { in: ACTIVE_BROADCAST_STATUSES } },
    data: { status: "cancelled", finishedAt: new Date() },
  });
}

/** Manda el embed por DM a quien está armando el envío, para ver cómo se ve antes de mandarlo a todos. */
export async function sendBroadcastTest(guildId: string, embedId: string, discordUserId: string) {
  const embed = await getEmbed(guildId, embedId);
  await sendDirectMessage(discordUserId, { embeds: [toDiscordEmbed(embed)] });
}
