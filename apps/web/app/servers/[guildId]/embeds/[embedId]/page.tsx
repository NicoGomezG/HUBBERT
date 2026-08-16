import { notFound } from "next/navigation";
import { EmbedNotFoundError, getEmbed } from "@hubbert/modules";
import { EmbedBuilder } from "@/components/embeds/EmbedBuilder";
import { deleteEmbedAction } from "./actions";

export default async function EditEmbedPage({
  params,
}: {
  params: Promise<{ guildId: string; embedId: string }>;
}) {
  const { guildId, embedId } = await params;

  let embed;
  try {
    embed = await getEmbed(guildId, embedId);
  } catch (err) {
    if (err instanceof EmbedNotFoundError) notFound();
    throw err;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Editar embed
        </h2>
        <form action={deleteEmbedAction.bind(null, guildId, embedId)}>
          <button
            type="submit"
            className="text-sm text-red-600 hover:underline dark:text-red-400"
          >
            Eliminar
          </button>
        </form>
      </div>
      <EmbedBuilder guildId={guildId} initial={embed} />
    </div>
  );
}
