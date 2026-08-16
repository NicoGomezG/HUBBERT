import { notFound } from "next/navigation";
import { BirthdayNotFoundError, getBirthday } from "@hubbert/modules";
import { BirthdayForm } from "@/components/birthdays/BirthdayForm";

export default async function EditBirthdayPage({
  params,
}: {
  params: Promise<{ guildId: string; birthdayId: string }>;
}) {
  const { guildId, birthdayId } = await params;

  let birthday;
  try {
    birthday = await getBirthday(guildId, birthdayId);
  } catch (err) {
    if (err instanceof BirthdayNotFoundError) notFound();
    throw err;
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Editar cumpleaños</h2>
      <BirthdayForm guildId={guildId} initial={birthday} />
    </div>
  );
}
