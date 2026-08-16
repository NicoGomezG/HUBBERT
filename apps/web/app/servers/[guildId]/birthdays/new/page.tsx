import { BirthdayForm } from "@/components/birthdays/BirthdayForm";

export default async function NewBirthdayPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Nuevo cumpleaños</h2>
      <BirthdayForm guildId={guildId} />
    </div>
  );
}
