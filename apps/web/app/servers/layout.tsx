import { Metal_Mania } from "next/font/google";
import { prisma } from "@hubbert/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Sidebar, type SidebarGuild, type SidebarUser } from "@/components/Sidebar";

const metalMania = Metal_Mania({ weight: "400", subsets: ["latin"] });

export default async function ServersLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const discordId = String(metadata.provider_id ?? "");

  const memberships = discordId
    ? await prisma.guildMember.findMany({
        where: { user: { discordId }, guild: { botInstalledAt: { not: null } } },
        select: { guild: { select: { id: true, name: true, iconUrl: true } } },
        orderBy: { guild: { name: "asc" } },
      })
    : [];

  const guilds: SidebarGuild[] = memberships.map(({ guild }) => guild);
  const sidebarUser: SidebarUser | null = user
    ? {
        name: String(metadata.full_name ?? metadata.name ?? metadata.user_name ?? "Usuario"),
        avatarUrl: typeof metadata.avatar_url === "string" ? metadata.avatar_url : null,
      }
    : null;

  return (
    <div className="relative min-h-screen bg-zinc-50 dark:bg-black">
      <div aria-hidden className="app-backdrop" />
      <Sidebar guilds={guilds} user={sidebarUser} brandFontClass={metalMania.className} />
      <div className="relative z-10 lg:pl-64">
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
