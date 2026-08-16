import Link from "next/link";
import { listEmbeds } from "@hubbert/modules";

export default async function EmbedsPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const embeds = await listEmbeds(guildId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Embeds</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Crea, guarda y envía embeds a los canales de este servidor.
          </p>
        </div>
        <Link
          href={`/servers/${guildId}/embeds/new`}
          className="rounded-md bg-[#5865F2] px-3 py-2 text-sm font-medium text-white hover:bg-[#4752C4]"
        >
          + Nuevo embed
        </Link>
      </div>

      {embeds.length === 0 && (
        <p className="rounded-md border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Todavía no creaste ningún embed.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {embeds.map((embed) => (
          <li key={embed.id}>
            <Link
              href={`/servers/${guildId}/embeds/${embed.id}`}
              className="flex items-center justify-between rounded-md border border-zinc-200 bg-white p-4 hover:border-[#5865F2] dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{embed.name}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {embed.title || "Sin título"}
                </p>
              </div>
              <span className="text-xs text-zinc-400">
                {embed.lastSentAt ? `Enviado ${embed.lastSentAt.toLocaleDateString("es")}` : "Nunca enviado"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
