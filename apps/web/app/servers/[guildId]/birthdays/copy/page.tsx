import { prisma } from "@hubbert/db";
import { hasManageAccess } from "@hubbert/discord";
import { listBirthdays } from "@hubbert/modules";
import { CopyBirthdaysForm } from "@/components/birthdays/CopyBirthdaysForm";
import { getGuildAccess } from "@/lib/guild-access";

export default async function CopyBirthdaysPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const access = await getGuildAccess(guildId);
  if (!access.ok) return null;

  // Mismo criterio que getGuildAccess: administrador (u owner) y bot instalado.
  const [birthdays, memberships] = await Promise.all([
    listBirthdays(guildId),
    prisma.guildMember.findMany({
      where: { userId: access.userId, guildId: { not: guildId }, guild: { botInstalledAt: { not: null } } },
      include: { guild: true },
      orderBy: { guild: { name: "asc" } },
    }),
  ]);
  const targets = memberships
    .filter((m) => m.isOwner || hasManageAccess(m.permissions))
    .map(({ guild }) => ({ id: guild.id, name: guild.name }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Copiar cumpleaños a otro servidor</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Se copian los {birthdays.length} cumpleaños de este servidor. Los que ya existan en el destino no se tocan.
        </p>
      </div>
      <CopyBirthdaysForm guildId={guildId} birthdayCount={birthdays.length} targets={targets} />
    </div>
  );
}
