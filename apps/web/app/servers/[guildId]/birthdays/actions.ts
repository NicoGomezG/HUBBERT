"use server";

import { revalidatePath } from "next/cache";
import { deleteBirthday, getBirthday, updateBirthday } from "@hubbert/modules";
import { getGuildAccess } from "@/lib/guild-access";

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
    isActive: !birthday.isActive,
  });
  revalidatePath(`/servers/${guildId}/birthdays`);
}
