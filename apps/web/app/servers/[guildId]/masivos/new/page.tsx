import { listEmbeds } from "@hubbert/modules";
import { BroadcastForm } from "@/components/broadcasts/BroadcastForm";

export default async function NewBroadcastPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const embeds = await listEmbeds(guildId);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Nuevo envío masivo</h2>
      <BroadcastForm
        guildId={guildId}
        embeds={embeds.map((e) => ({
          id: e.id,
          name: e.name,
          // Sin senderName/avatar: por DM siempre lo manda el bot.
          preview: {
            title: e.title,
            description: e.description,
            url: e.url,
            color: e.color,
            authorName: e.authorName,
            authorIconUrl: e.authorIconUrl,
            imageUrl: e.imageUrl,
            thumbnailUrl: e.thumbnailUrl,
            footerText: e.footerText,
            footerIconUrl: e.footerIconUrl,
            showTimestamp: e.showTimestamp,
            fields: e.fields.map((f) => ({ name: f.name, value: f.value, inline: f.inline })),
          },
        }))}
      />
    </div>
  );
}
