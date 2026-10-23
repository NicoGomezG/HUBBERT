import { Prisma, prisma } from "@hubbert/db";
import type { BirthdayInput } from "./schema";

export class BirthdayNotFoundError extends Error {}
export class BirthdayDuplicateError extends Error {}

export function listBirthdays(guildId: string) {
  return prisma.birthday.findMany({
    where: { guildId },
    orderBy: [{ month: "asc" }, { day: "asc" }],
  });
}

export async function getBirthday(guildId: string, birthdayId: string) {
  const birthday = await prisma.birthday.findFirst({ where: { id: birthdayId, guildId } });
  if (!birthday) throw new BirthdayNotFoundError();
  return birthday;
}

export async function createBirthday(guildId: string, userId: string, input: BirthdayInput) {
  try {
    return await prisma.birthday.create({
      data: { guildId, createdBy: userId, ...input },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new BirthdayDuplicateError();
    }
    throw err;
  }
}

export async function updateBirthday(guildId: string, birthdayId: string, input: BirthdayInput) {
  await getBirthday(guildId, birthdayId);
  return prisma.birthday.update({ where: { id: birthdayId }, data: input });
}

export async function deleteBirthday(guildId: string, birthdayId: string) {
  await getBirthday(guildId, birthdayId);
  await prisma.birthday.delete({ where: { id: birthdayId } });
}

export interface CopyBirthdaysOptions {
  /** Canal del servidor destino; null usa el canal por defecto. Los canales del origen no existen allá. */
  channelId: string | null;
  /** Si viene, solo se copian los cumpleaños de estos usuarios (miembros del destino). */
  memberIds?: string[];
}

export interface CopyBirthdaysSummary {
  copied: number;
  /** Ya tenían cumpleaños en el destino: no se tocan. */
  skippedExisting: number;
  skippedNotMember: number;
}

export async function copyBirthdays(
  sourceGuildId: string,
  targetGuildId: string,
  userId: string,
  options: CopyBirthdaysOptions
): Promise<CopyBirthdaysSummary> {
  const [source, existing] = await Promise.all([
    listBirthdays(sourceGuildId),
    prisma.birthday.findMany({ where: { guildId: targetGuildId }, select: { discordUserId: true } }),
  ]);
  const existingIds = new Set(existing.map((b) => b.discordUserId));
  const memberIds = options.memberIds ? new Set(options.memberIds) : null;

  let skippedExisting = 0;
  let skippedNotMember = 0;
  const toCopy = source.filter((b) => {
    if (existingIds.has(b.discordUserId)) {
      skippedExisting++;
      return false;
    }
    if (memberIds && !memberIds.has(b.discordUserId)) {
      skippedNotMember++;
      return false;
    }
    return true;
  });

  // skipDuplicates cubre a alguien creado en el destino entre la lectura y la escritura.
  const { count } = await prisma.birthday.createMany({
    data: toCopy.map((b) => ({
      guildId: targetGuildId,
      createdBy: userId,
      discordUserId: b.discordUserId,
      displayName: b.displayName,
      day: b.day,
      month: b.month,
      year: b.year,
      channelId: options.channelId,
      customMessage: b.customMessage,
      imageUrl: b.imageUrl,
      color: b.color,
      isActive: b.isActive,
    })),
    skipDuplicates: true,
  });

  return { copied: count, skippedExisting: skippedExisting + (toCopy.length - count), skippedNotMember };
}
