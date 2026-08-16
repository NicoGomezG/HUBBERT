import { prisma } from "@hubbert/db";
import type { GuildSettingsInput } from "./schema";

export async function getGuildSettings(guildId: string) {
  return prisma.guildSettings.upsert({
    where: { guildId },
    create: { guildId },
    update: {},
  });
}

export async function updateGuildSettings(guildId: string, input: GuildSettingsInput) {
  return prisma.guildSettings.upsert({
    where: { guildId },
    create: { guildId, timezone: input.timezone, defaultChannelId: input.defaultChannelId },
    update: { timezone: input.timezone, defaultChannelId: input.defaultChannelId },
  });
}
