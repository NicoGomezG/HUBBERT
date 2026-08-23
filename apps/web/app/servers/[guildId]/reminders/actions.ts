"use server";

import { revalidatePath } from "next/cache";
import { deleteReminder, getReminder, updateReminder } from "@hubbert/modules";
import { getGuildAccess } from "@/lib/guild-access";

export async function deleteReminderAction(guildId: string, reminderId: string) {
  const access = await getGuildAccess(guildId);
  if (!access.ok) return;

  await deleteReminder(guildId, reminderId);
  revalidatePath(`/servers/${guildId}/reminders`);
}

export async function toggleActiveAction(guildId: string, reminderId: string) {
  const access = await getGuildAccess(guildId);
  if (!access.ok) return;

  const reminder = await getReminder(guildId, reminderId);
  await updateReminder(guildId, reminderId, {
    title: reminder.title,
    description: reminder.description,
    targetDate: reminder.targetDate,
    channelId: reminder.channelId,
    daysBefore: reminder.daysBefore,
    repeatMode: reminder.repeatMode as "daily" | "once",
    customMessage: reminder.customMessage,
    imageUrl: reminder.imageUrl,
    color: reminder.color,
    isActive: !reminder.isActive,
  });
  revalidatePath(`/servers/${guildId}/reminders`);
}
