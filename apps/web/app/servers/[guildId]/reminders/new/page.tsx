import { ReminderForm } from "@/components/reminders/ReminderForm";

export default async function NewReminderPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Nuevo recordatorio</h2>
      <ReminderForm guildId={guildId} />
    </div>
  );
}
