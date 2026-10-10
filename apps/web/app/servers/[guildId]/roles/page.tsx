import Link from "next/link";
import { listReactionRolePanels } from "@hubbert/modules";
import { deleteReactionRolePanelAction } from "./actions";

const CUSTOM_EMOJI_RE = /^<(a?):(\w+):(\d+)>$/;

function EmojiPreview({ emoji }: { emoji: string }) {
  const custom = CUSTOM_EMOJI_RE.exec(emoji);
  if (!custom) return <span>{emoji}</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://cdn.discordapp.com/emojis/${custom[3]}.${custom[1] ? "gif" : "png"}`}
      alt={custom[2]}
      className="inline h-5 w-5"
    />
  );
}

export default async function ReactionRolesPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const panels = await listReactionRolePanels(guildId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Roles por reacción</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Un panel es un mensaje donde cada emoji entrega un rol: los miembros reaccionan para ponérselo y quitan la
            reacción para sacárselo.
          </p>
        </div>
        <Link
          href={`/servers/${guildId}/roles/new`}
          className="shrink-0 rounded-md bg-[#5865F2] px-3 py-2 text-sm font-medium text-white hover:bg-[#4752C4]"
        >
          + Nuevo panel
        </Link>
      </div>

      {panels.length === 0 && (
        <p className="rounded-md border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Todavía no publicaste ningún panel de roles.
        </p>
      )}

      {panels.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-2 font-medium">Título</th>
                <th className="px-4 py-2 font-medium">Emojis</th>
                <th className="px-4 py-2 font-medium">Modo</th>
                <th className="px-4 py-2 font-medium">Publicado</th>
                <th className="px-4 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {panels.map((p) => (
                <tr key={p.id} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="px-4 py-2 text-zinc-900 dark:text-zinc-50">{p.title}</td>
                  <td className="px-4 py-2">
                    <span className="flex flex-wrap items-center gap-1">
                      {p.options.map((o) => (
                        <EmojiPreview key={o.id} emoji={o.emoji} />
                      ))}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-zinc-600 dark:text-zinc-300">
                    {p.mode === "single" ? "Único" : "Múltiple"}
                  </td>
                  <td className="px-4 py-2 text-zinc-600 dark:text-zinc-300">
                    {p.createdAt.toLocaleDateString("es-CL")}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <a
                        href={`https://discord.com/channels/${guildId}/${p.channelId}/${p.messageId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-[#5865F2] hover:underline"
                      >
                        Ver mensaje
                      </a>
                      <form action={deleteReactionRolePanelAction.bind(null, guildId, p.id)}>
                        <button type="submit" className="text-xs text-red-600 hover:underline dark:text-red-400">
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
