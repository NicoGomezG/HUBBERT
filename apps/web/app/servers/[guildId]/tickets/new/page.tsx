import { PanelForm } from "@/components/tickets/PanelForm";

export default async function NewTicketPanelPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Nuevo panel de tickets</h2>
      <PanelForm guildId={guildId} />
    </div>
  );
}
