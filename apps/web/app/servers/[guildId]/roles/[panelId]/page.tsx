import { notFound } from "next/navigation";
import { ReactionRolePanelNotFoundError, getReactionRolePanel } from "@hubbert/modules";
import { ReactionRolePanelForm } from "@/components/reaction-roles/ReactionRolePanelForm";

export default async function EditReactionRolePanelPage({
  params,
}: {
  params: Promise<{ guildId: string; panelId: string }>;
}) {
  const { guildId, panelId } = await params;

  let panel;
  try {
    panel = await getReactionRolePanel(guildId, panelId);
  } catch (err) {
    if (err instanceof ReactionRolePanelNotFoundError) notFound();
    throw err;
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Editar panel de roles</h2>
      <ReactionRolePanelForm guildId={guildId} initial={panel} />
    </div>
  );
}
