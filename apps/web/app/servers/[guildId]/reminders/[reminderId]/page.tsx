import { notFound } from "next/navigation";
import { ReminderNotFoundError, getReminder } from "@hubbert/modules";
import { ReminderForm } from "@/components/reminders/ReminderForm";

export default async function EditReminderPage({
  params,
}: {
  params: Promise<{ guildId: string; reminderId: string }>;
}) {
  const { guildId, reminderId } = await params;

  let reminder;
  try {
    reminder = await getReminder(guildId, reminderId);
  } catch (err) {
    if (err instanceof ReminderNotFoundError) notFound();
    throw err;
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Editar recordatorio</h2>
      <ReminderForm guildId={guildId} initial={reminder} />
    </div>
  );
}
