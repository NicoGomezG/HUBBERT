import { notFound } from "next/navigation";
import { TicketPanelNotFoundError, getPanel } from "@hubbert/modules";
import { PanelForm } from "@/components/tickets/PanelForm";

export default async function EditTicketPanelPage({
  params,
}: {
  params: Promise<{ guildId: string; panelId: string }>;
}) {
  const { guildId, panelId } = await params;

  let panel;
  try {
    panel = await getPanel(guildId, panelId);
  } catch (err) {
    if (err instanceof TicketPanelNotFoundError) notFound();
    throw err;
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Editar panel de tickets</h2>
      <PanelForm guildId={guildId} initial={panel} />
    </div>
  );
}
