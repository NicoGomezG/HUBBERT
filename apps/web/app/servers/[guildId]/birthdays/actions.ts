"use server";

import { revalidatePath } from "next/cache";
import {
  copyBirthdays,
  deleteBirthday,
  getBirthday,
  updateBirthday,
  type CopyBirthdaysSummary,
} from "@hubbert/modules";
import { fetchAllMemberIds, fetchGuildTextChannels } from "@hubbert/discord";
import { getGuildAccess } from "@/lib/guild-access";

export type CopyBirthdaysResult =
  | { ok: true; summary: CopyBirthdaysSummary }
  | { ok: false; error: string };

export async function copyBirthdaysAction(
  sourceGuildId: string,
  input: { targetGuildId: string; channelId: string | null; onlyMembers: boolean }
): Promise<CopyBirthdaysResult> {
  if (input.targetGuildId === sourceGuildId) {
    return { ok: false, error: "Elige un servidor distinto al actual." };
  }

  // Hay que poder administrar los dos: leer en el origen y escribir en el destino.
  const [source, target] = await Promise.all([
    getGuildAccess(sourceGuildId),
    getGuildAccess(input.targetGuildId),
  ]);
  if (!source.ok) return { ok: false, error: "No tienes acceso a este servidor." };
  if (!target.ok) {
    return {
      ok: false,
      error:
        target.reason === "bot_not_installed"
          ? "Hubbert no está instalado en el servidor destino."
          : "No tienes permiso de administrador en el servidor destino.",
    };
  }

  if (input.channelId) {
    const channels = await fetchGuildTextChannels(input.targetGuildId);
    if (!channels.some((c) => c.id === input.channelId)) {
      return { ok: false, error: "Ese canal no pertenece al servidor destino." };
    }
  }

  const summary = await copyBirthdays(sourceGuildId, input.targetGuildId, target.userId, {
    channelId: input.channelId,
    memberIds: input.onlyMembers ? await fetchAllMemberIds(input.targetGuildId) : undefined,
  });
  revalidatePath(`/servers/${input.targetGuildId}/birthdays`);
  return { ok: true, summary };
}

export async function deleteBirthdayAction(guildId: string, birthdayId: string) {
  const access = await getGuildAccess(guildId);
  if (!access.ok) return;

  await deleteBirthday(guildId, birthdayId);
  revalidatePath(`/servers/${guildId}/birthdays`);
}

export async function toggleActiveAction(guildId: string, birthdayId: string) {
  const access = await getGuildAccess(guildId);
  if (!access.ok) return;

  const birthday = await getBirthday(guildId, birthdayId);
  await updateBirthday(guildId, birthdayId, {
    discordUserId: birthday.discordUserId,
    displayName: birthday.displayName,
    day: birthday.day,
    month: birthday.month,
    year: birthday.year,
    channelId: birthday.channelId,
    customMessage: birthday.customMessage,
    imageUrl: birthday.imageUrl,
    color: birthday.color,
    isActive: !birthday.isActive,
  });
  revalidatePath(`/servers/${guildId}/birthdays`);
}
