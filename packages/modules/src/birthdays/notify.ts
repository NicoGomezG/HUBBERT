import { Prisma, prisma } from "@hubbert/db";
import { buildDiscordEmbed, sendEmbedToChannel, translateDiscordError } from "@hubbert/discord";
import { renderBirthdayMessage } from "./message";

export interface BirthdayRunSummary {
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
}

/**
 * Corre una vez al día (Vercel Cron). Idempotente: el INSERT con el
 * índice único (birthdayId, notificationDate) actúa como lock — si dos
 * invocaciones corren en paralelo para el mismo día, la segunda falla al
 * insertar y no manda un segundo mensaje.
 *
 * v1 no tiene en cuenta el timezone por-guild (GuildSettings.timezone):
 * usa la fecha UTC del momento en que corre el cron. Limitación de
 * alcance conocida, no un bug — ver blueprint, sección de riesgos.
 */
export async function sendDueBirthdayNotifications(now = new Date()): Promise<BirthdayRunSummary> {
  const day = now.getUTCDate();
  const month = now.getUTCMonth() + 1;
  const notificationDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const birthdays = await prisma.birthday.findMany({
    where: { day, month, isActive: true },
    include: { guild: { include: { settings: true } } },
  });

  const summary: BirthdayRunSummary = { processed: birthdays.length, sent: 0, skipped: 0, failed: 0 };

  for (const birthday of birthdays) {
    const channelId = birthday.channelId ?? birthday.guild.settings?.defaultChannelId ?? null;
    if (!channelId) {
      summary.skipped++;
      continue;
    }

    try {
      await prisma.birthdayNotification.create({
        data: { birthdayId: birthday.id, guildId: birthday.guildId, notificationDate, status: "pending" },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        summary.skipped++; // ya se envió hoy para este cumpleaños
        continue;
      }
      throw err;
    }

    try {
      const template = birthday.customMessage || "🎉 ¡Feliz cumpleaños, {user}! 🎂";
      const age = birthday.year != null ? notificationDate.getUTCFullYear() - birthday.year : null;
      const description = renderBirthdayMessage(template, {
        discordUserId: birthday.discordUserId,
        displayName: birthday.displayName,
        guildName: birthday.guild.name,
        age,
      });
      await sendEmbedToChannel(
        channelId,
        buildDiscordEmbed({
          description,
          color: birthday.color ?? 0xffd54f,
          imageUrl: birthday.imageUrl,
        })
      );

      await prisma.birthdayNotification.updateMany({
        where: { birthdayId: birthday.id, notificationDate },
        data: { status: "sent", sentAt: new Date() },
      });
      summary.sent++;
    } catch (err) {
      await prisma.birthdayNotification.updateMany({
        where: { birthdayId: birthday.id, notificationDate },
        data: { status: "failed", errorMessage: translateDiscordError(err) },
      });
      summary.failed++;
    }
  }

  return summary;
}
