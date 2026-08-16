"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { slug: "embeds", label: "Embeds" },
  { slug: "birthdays", label: "Cumpleaños" },
  { slug: "settings", label: "Configuración" },
  { slug: "ayuda", label: "Ayuda" },
] as const;

export function GuildNav({ guildId }: { guildId: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
      {TABS.map((tab) => {
        const href = `/servers/${guildId}/${tab.slug}`;
        const active = pathname.startsWith(href);
        return (
          <Link
            key={tab.slug}
            href={href}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "border-[#5865F2] text-zinc-900 dark:text-zinc-50"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
