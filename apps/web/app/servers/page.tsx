import Link from "next/link";
import { prisma } from "@hubbert/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { refreshBotPresence } from "./actions";

const BOT_INVITE_PERMISSIONS = "84992"; // View Channels, Send Messages, Embed Links, Read Message History

function botInviteUrl(guildId: string): string {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    permissions: BOT_INVITE_PERMISSIONS,
    scope: "bot",
    guild_id: guildId,
    disable_guild_select: "true",
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

export default async function ServersPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const discordId = String(
    (user?.user_metadata as Record<string, unknown> | undefined)?.provider_id ?? ""
  );

  const memberships = discordId
    ? await prisma.guildMember.findMany({
        where: { user: { discordId } },
        include: { guild: true },
        orderBy: { guild: { name: "asc" } },
      })
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Tus servidores
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Servidores donde tienes permiso de administrador y puedes configurar Hubbert.
          </p>
        </div>
        <form action={refreshBotPresence}>
          <button
            type="submit"
            className="whitespace-nowrap rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Actualizar estado del bot
          </button>
        </form>
      </div>

      {memberships.length === 0 && (
        <p className="rounded-md border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          No encontramos servidores donde tengas permiso de administrador.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {memberships.map(({ guild }) => (
          <li
            key={guild.id}
            className="flex items-center justify-between rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-center gap-3">
              {guild.iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={guild.iconUrl} alt="" className="h-8 w-8 rounded-full" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              )}
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {guild.name}
              </span>
            </div>
            {guild.botInstalledAt ? (
              <Link
                href={`/servers/${guild.id}`}
                className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:hover:bg-emerald-900"
              >
                Configurar →
              </Link>
            ) : (
              <a
                href={botInviteUrl(guild.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-[#5865F2] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#4752C4]"
              >
                Invitar bot
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
