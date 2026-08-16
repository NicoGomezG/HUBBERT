import { EmbedBuilder } from "@/components/embeds/EmbedBuilder";

export default async function NewEmbedPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Nuevo embed</h2>
      <EmbedBuilder guildId={guildId} />
    </div>
  );
}
