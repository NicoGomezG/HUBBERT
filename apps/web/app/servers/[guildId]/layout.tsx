import Link from "next/link";
import { redirect } from "next/navigation";
import { Germania_One } from "next/font/google";
import { getGuildAccess } from "@/lib/guild-access";
import { GuildNav } from "@/components/GuildNav";

// Fuente angular estilo runas nórdicas, como la tipografía de las camisetas
// de la selección de Noruega (ej. "HAALAND").
const germaniaOne = Germania_One({ weight: "400", subsets: ["latin"] });

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
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        {access.guild.iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={access.guild.iconUrl} alt="" className="h-9 w-9 rounded-full" />
        ) : (
          <div className="h-9 w-9 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        )}
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {access.guild.name}
          </h1>
          <span
            className={`${germaniaOne.className} text-sm tracking-wide text-zinc-500 dark:text-zinc-400`}
          >
            by Nicogomez
          </span>
        </div>
      </div>
      <GuildNav guildId={guildId} />
      {children}
    </div>
  );
}
