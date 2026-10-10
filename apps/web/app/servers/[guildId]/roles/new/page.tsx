import { ReactionRolePanelForm } from "@/components/reaction-roles/ReactionRolePanelForm";

export default async function NewReactionRolePanelPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Nuevo panel de roles</h2>
      <ReactionRolePanelForm guildId={guildId} />
    </div>
  );
}
