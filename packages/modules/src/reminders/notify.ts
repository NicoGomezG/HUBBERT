import { Prisma, prisma } from "@hubbert/db";
import { buildDiscordEmbed, sendEmbedToChannel, translateDiscordError } from "@hubbert/discord";
import { daysUntil } from "./format";
import { defaultReminderTemplate, renderReminderMessage } from "./message";

export interface ReminderRunSummary {
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
}

/**
 * Corre una vez al día (Vercel Cron). Idempotente igual que los cumpleaños:
 * el INSERT con índice único (reminderId, notificationDate) actúa como lock.
 *
 * Un recordatorio "daily" avisa todos los días desde daysBefore hasta el día
 * del evento (remaining entre 0 y daysBefore). Uno "once" avisa una sola vez,
 * exactamente daysBefore días antes (remaining === daysBefore).
 */
export async function sendDueReminderNotifications(now = new Date()): Promise<ReminderRunSummary> {
  const notificationDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const reminders = await prisma.reminder.findMany({
    where: { isActive: true, targetDate: { gte: notificationDate } },
    include: { guild: { include: { settings: true } } },
  });

  const summary: ReminderRunSummary = { processed: reminders.length, sent: 0, skipped: 0, failed: 0 };

  for (const reminder of reminders) {
    const remaining = daysUntil(reminder.targetDate, now);
    const isDue =
      reminder.repeatMode === "once" ? remaining === reminder.daysBefore : remaining >= 0 && remaining <= reminder.daysBefore;
    if (!isDue) {
      summary.skipped++;
      continue;
    }

    const channelId = reminder.channelId ?? reminder.guild.settings?.defaultChannelId ?? null;
    if (!channelId) {
      summary.skipped++;
      continue;
    }

    try {
      await prisma.reminderNotification.create({
        data: { reminderId: reminder.id, guildId: reminder.guildId, notificationDate, status: "pending" },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        summary.skipped++; // ya se avisó hoy para este recordatorio
        continue;
      }
      throw err;
    }

    try {
      const template = reminder.customMessage || defaultReminderTemplate(remaining);
      const description = renderReminderMessage(template, {
        title: reminder.title,
        description: reminder.description,
        daysRemaining: remaining,
        targetDate: reminder.targetDate,
        guildName: reminder.guild.name,
      });
      await sendEmbedToChannel(
        channelId,
        buildDiscordEmbed({
          description,
          color: reminder.color ?? 0x5865f2,
          imageUrl: reminder.imageUrl,
        })
      );

      await prisma.reminderNotification.updateMany({
        where: { reminderId: reminder.id, notificationDate },
        data: { status: "sent", sentAt: new Date() },
      });
      summary.sent++;
    } catch (err) {
      await prisma.reminderNotification.updateMany({
        where: { reminderId: reminder.id, notificationDate },
        data: { status: "failed", errorMessage: translateDiscordError(err) },
      });
      summary.failed++;
    }
  }

  return summary;
}
