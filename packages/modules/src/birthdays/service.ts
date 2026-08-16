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
