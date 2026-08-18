import { prisma } from "@hubbert/db";
import { buildDiscordEmbed, sendEmbedToChannel } from "@hubbert/discord";
import { formatBirthdayLine, monthName } from "./format";

export interface MonthlyBirthdaySummary {
  guildsWithBirthdays: number;
  sent: number;
  skipped: number;
  failed: number;
}

/**
 * Corre el día 1 de cada mes (Vercel Cron). Un mensaje por servidor con
 * todos los cumpleaños del mes, publicado en el canal por defecto
 * (GuildSettings.defaultChannelId) — si el servidor no lo configuró, se
 * salta ese servidor ese mes.
 */
export async function sendMonthlyBirthdaySummary(now = new Date()): Promise<MonthlyBirthdaySummary> {
  const month = now.getUTCMonth() + 1;

  const birthdays = await prisma.birthday.findMany({
    where: { month, isActive: true },
    include: { guild: { include: { settings: true } } },
    orderBy: [{ guildId: "asc" }, { day: "asc" }],
  });

  const byGuild = new Map<string, typeof birthdays>();
  for (const b of birthdays) {
    if (!byGuild.has(b.guildId)) byGuild.set(b.guildId, []);
    byGuild.get(b.guildId)!.push(b);
  }

  const summary: MonthlyBirthdaySummary = { guildsWithBirthdays: byGuild.size, sent: 0, skipped: 0, failed: 0 };

  for (const guildBirthdays of byGuild.values()) {
    const guild = guildBirthdays[0].guild;
    const channelId = guild.settings?.defaultChannelId;
    if (!channelId) {
      summary.skipped++;
      continue;
    }

    try {
      const description = guildBirthdays.map(formatBirthdayLine).join("\n");
      await sendEmbedToChannel(
        channelId,
        buildDiscordEmbed({ title: `🎂 Cumpleaños de ${monthName(month)}`, description, color: 0xffd54f })
      );
      summary.sent++;
    } catch {
      summary.failed++;
    }
  }

  return summary;
}
