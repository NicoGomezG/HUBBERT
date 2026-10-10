import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuildAccess } from "@/lib/guild-access";

export default async function GuildLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const access = await getGuildAccess(guildId);

  if (!access.ok && access.reason !== "bot_not_installed") {
    redirect("/servers");
  }

  if (!access.ok) {
    // reason === "bot_not_installed": la guild es del usuario, pero no hay
    // nada que configurar todavía.
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Todavía no invitaste el bot a este servidor.
        </p>
        <Link
          href="/servers"
          className="text-sm font-medium text-[#5865F2] hover:underline"
        >
          ← Volver a Mis servidores
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4 border-b border-zinc-200/80 pb-6 dark:border-zinc-800/70">
        <div className="relative shrink-0">
          {access.guild.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={access.guild.iconUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
          ) : (
            <div className="h-12 w-12 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          )}
          <span className="absolute -right-1 -bottom-1 h-3.5 w-3.5 rounded-full border-2 border-zinc-50 bg-emerald-500 dark:border-black" />
        </div>
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-[0.16em] text-zinc-400 uppercase dark:text-zinc-500">
            Panel del servidor
          </p>
          <h1 className="truncate text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-50">
            {access.guild.name}
          </h1>
        </div>
      </div>
      <div className="animate-fade-in">{children}</div>
    </div>
  );
}
