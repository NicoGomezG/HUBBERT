import { prisma } from "@hubbert/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
      <div>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Tus servidores
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Servidores donde tenés permiso de administrador y podés configurar Hubbert.
        </p>
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
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                guild.botInstalledAt
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
              }`}
            >
              {guild.botInstalledAt ? "Bot instalado" : "Bot no instalado"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
