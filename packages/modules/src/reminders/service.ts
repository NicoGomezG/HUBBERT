import { prisma } from "@hubbert/db";
import type { ReminderInput } from "./schema";

export class ReminderNotFoundError extends Error {}

export function listReminders(guildId: string) {
  return prisma.reminder.findMany({
    where: { guildId },
    orderBy: [{ targetDate: "asc" }],
  });
}

export async function getReminder(guildId: string, reminderId: string) {
  const reminder = await prisma.reminder.findFirst({ where: { id: reminderId, guildId } });
  if (!reminder) throw new ReminderNotFoundError();
  return reminder;
}

export async function createReminder(guildId: string, userId: string, input: ReminderInput) {
  return prisma.reminder.create({
    data: { guildId, createdBy: userId, ...input },
  });
}

export async function updateReminder(guildId: string, reminderId: string, input: ReminderInput) {
  await getReminder(guildId, reminderId);
  return prisma.reminder.update({ where: { id: reminderId }, data: input });
}

export async function deleteReminder(guildId: string, reminderId: string) {
  await getReminder(guildId, reminderId);
  await prisma.reminder.delete({ where: { id: reminderId } });
}
