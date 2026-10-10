"use client";

import Image from "next/image";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type IconName =
  | "embeds"
  | "bienvenida"
  | "reminders"
  | "birthdays"
  | "roles"
  | "tickets"
  | "settings"
  | "donaciones"
  | "ayuda"
  | "servers"
  | "logout"
  | "menu"
  | "close"
  | "chevrons";

const ICON_PATHS: Record<IconName, string[]> = {
  embeds: ["M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z", "M8 8h8", "M8 12h5"],
  bienvenida: ["M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z", "M19 16v5", "M16.5 18.5h5"],
  reminders: ["M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9", "M10.3 21a1.94 1.94 0 0 0 3.4 0"],
  birthdays: [
    "M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8",
    "M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1",
    "M2 21h20",
    "M7 8v3",
    "M12 8v3",
    "M17 8v3",
  ],
  roles: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", "m9 12 2 2 4-4"],
  tickets: [
    "M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z",
    "M13 5v2",
    "M13 11v2",
    "M13 17v2",
  ],
  settings: ["M4 21v-7", "M4 10V3", "M12 21v-9", "M12 8V3", "M20 21v-5", "M20 12V3", "M1 14h6", "M9 8h6", "M17 16h6"],
  donaciones: [
    "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",
  ],
  ayuda: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3", "M12 17h.01"],
  servers: ["M3 3h7v7H3z", "M14 3h7v7h-7z", "M14 14h7v7h-7z", "M3 14h7v7H3z"],
  logout: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "m16 17 5-5-5-5", "M21 12H9"],
  menu: ["M4 7h16", "M4 12h16", "M4 17h10"],
  close: ["M18 6 6 18", "m6 6 12 12"],
  chevrons: ["m7 15 5 5 5-5", "m7 9 5-5 5 5"],
};

function Icon({ name, className = "h-4 w-4" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {ICON_PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

const SECTIONS: { label: string; items: { slug: string; label: string; icon: IconName }[] }[] = [
  {
    label: "Mensajes",
    items: [
      { slug: "embeds", label: "Embeds", icon: "embeds" },
      { slug: "bienvenida", label: "Bienvenida", icon: "bienvenida" },
      { slug: "reminders", label: "Recordatorios", icon: "reminders" },
    ],
  },
  {
    label: "Comunidad",
    items: [
      { slug: "birthdays", label: "Cumpleaños", icon: "birthdays" },
      { slug: "roles", label: "Roles", icon: "roles" },
      { slug: "tickets", label: "Tickets", icon: "tickets" },
    ],
  },
  {
    label: "Servidor",
    items: [
      { slug: "settings", label: "Configuración", icon: "settings" },
      { slug: "donaciones", label: "Donaciones", icon: "donaciones" },
      { slug: "ayuda", label: "Ayuda", icon: "ayuda" },
    ],
  },
];

export type SidebarGuild = { id: string; name: string; iconUrl: string | null };
export type SidebarUser = { name: string; avatarUrl: string | null };

function GuildAvatar({ guild, size = "h-8 w-8" }: { guild: SidebarGuild | null; size?: string }) {
  if (guild?.iconUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={guild.iconUrl} alt="" className={`${size} shrink-0 rounded-lg object-cover`} />;
  }
  return (
    <div
      className={`${size} flex shrink-0 items-center justify-center rounded-lg bg-zinc-200 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300`}
    >
      {guild ? guild.name.slice(0, 1).toUpperCase() : "?"}
    </div>
  );
}

function navItemClass(active: boolean) {
  return `group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
    active
      ? "bg-zinc-900/[0.06] font-medium text-zinc-900 dark:bg-white/[0.06] dark:text-zinc-50"
      : "text-zinc-500 hover:bg-zinc-900/[0.03] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.03] dark:hover:text-zinc-50"
  }`;
}

/** Punto que pulsa mientras carga la sección clickeada (debe ir dentro de un Link). */
function PendingDot() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={`ml-auto h-1.5 w-1.5 rounded-full bg-accent transition-opacity duration-200 ${
        pending ? "animate-pulse opacity-100" : "opacity-0"
      }`}
    />
  );
}

function ActiveBar() {
  return (
    <span
      aria-hidden
      className="absolute inset-y-2 -left-3 w-0.5 rounded-full bg-accent shadow-[0_0_12px_2px_rgb(88_101_242/0.6)]"
    />
  );
}

function SidebarContent({
  guilds,
  user,
  brandFontClass,
  onNavigate,
}: {
  guilds: SidebarGuild[];
  user: SidebarUser | null;
  brandFontClass: string;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const guildId = pathname.match(/^\/servers\/([^/]+)/)?.[1] ?? null;
  const currentGuild = guildId ? (guilds.find((g) => g.id === guildId) ?? null) : null;

  function navigate() {
    setSwitcherOpen(false);
    onNavigate();
  }

  return (
    <div className="flex h-full flex-col">
      <Link href="/servers" onClick={navigate} className="flex items-center gap-2.5 px-5 pt-6 pb-5">
        <Image src="/logo.png" alt="" width={30} height={30} />
        <div className="flex flex-col leading-none">
          <span className="text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Hubbert</span>
          <span className={`${brandFontClass} mt-0.5 text-[11px] tracking-wide text-zinc-500 dark:text-zinc-400`}>
            made by NGZ
          </span>
        </div>
      </Link>

      {/* Selector de servidor */}
      <div className="relative px-3">
        <button
          type="button"
          onClick={() => setSwitcherOpen((o) => !o)}
          aria-expanded={switcherOpen}
          className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white/70 p-2 text-left transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950/60 dark:hover:border-zinc-700"
        >
          {guildId ? (
            <GuildAvatar guild={currentGuild} />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Icon name="servers" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] tracking-[0.14em] text-zinc-400 uppercase">Servidor</p>
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {guildId ? (currentGuild?.name ?? "Servidor") : "Elegir servidor"}
            </p>
          </div>
          <Icon name="chevrons" className="h-4 w-4 shrink-0 text-zinc-400" />
        </button>

        {switcherOpen && (
          <div className="animate-fade-in absolute inset-x-3 top-full z-20 mt-2 max-h-72 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl shadow-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/40">
            {guilds.length === 0 && (
              <p className="px-2 py-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
                Sin servidores con Hubbert.
              </p>
            )}
            {guilds.map((g) => (
              <Link
                key={g.id}
                href={`/servers/${g.id}/embeds`}
                onClick={navigate}
                className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                  g.id === guildId
                    ? "bg-zinc-900/[0.06] text-zinc-900 dark:bg-white/[0.06] dark:text-zinc-50"
                    : "text-zinc-600 hover:bg-zinc-900/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.04]"
                }`}
              >
                <GuildAvatar guild={g} size="h-6 w-6" />
                <span className="truncate">{g.name}</span>
              </Link>
            ))}
            <div className="my-1 h-px bg-zinc-200 dark:bg-zinc-800" />
            <Link
              href="/servers"
              onClick={navigate}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-zinc-500 hover:bg-zinc-900/[0.04] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-50"
            >
              <Icon name="servers" />
              Ver todos los servidores
            </Link>
          </div>
        )}
      </div>

      <nav className="mt-6 flex-1 overflow-y-auto px-3 pb-4">
        {guildId ? (
          <div className="flex flex-col gap-6">
            {SECTIONS.map((section) => (
              <div key={section.label} className="flex flex-col gap-0.5">
                <p className="px-3 pb-1.5 font-mono text-[10px] tracking-[0.16em] text-zinc-400 uppercase dark:text-zinc-500">
                  {section.label}
                </p>
                {section.items.map((item) => {
                  const href = `/servers/${guildId}/${item.slug}`;
                  const active = pathname.startsWith(href);
                  return (
                    <Link
                      key={item.slug}
                      href={href}
                      onClick={navigate}
                      aria-current={active ? "page" : undefined}
                      className={navItemClass(active)}
                    >
                      {active && <ActiveBar />}
                      <Icon
                        name={item.icon}
                        className={`h-4 w-4 shrink-0 ${active ? "text-accent" : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"}`}
                      />
                      {item.label}
                      <PendingDot />
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            <Link href="/servers" onClick={navigate} className={navItemClass(pathname === "/servers")}>
              {pathname === "/servers" && <ActiveBar />}
              <Icon name="servers" className="h-4 w-4 shrink-0 text-accent" />
              Mis servidores
            </Link>
          </div>
        )}
      </nav>

      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800/80">
        <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full" />
          ) : (
            <div className="h-8 w-8 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{user?.name ?? "Usuario"}</p>
            <p className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_1px_rgb(16_185_129/0.6)]" />
              Conectado
            </p>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="rounded-md p-2 text-zinc-400 transition-colors hover:bg-zinc-900/[0.05] hover:text-zinc-900 dark:hover:bg-white/[0.05] dark:hover:text-zinc-50"
            >
              <Icon name="logout" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({
  guilds,
  user,
  brandFontClass,
}: {
  guilds: SidebarGuild[];
  user: SidebarUser | null;
  brandFontClass: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  const content = (
    <SidebarContent
      guilds={guilds}
      user={user}
      brandFontClass={brandFontClass}
      onNavigate={() => setMobileOpen(false)}
    />
  );

  return (
    <>
      {/* Barra superior en móvil / tablet */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200/70 bg-zinc-50/75 px-4 py-3 backdrop-blur-xl lg:hidden dark:border-zinc-800/70 dark:bg-black/60">
        <Link href="/servers" className="flex items-center gap-2">
          <Image src="/logo.png" alt="" width={26} height={26} />
          <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Hubbert</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
          className="rounded-lg border border-zinc-200 p-2 text-zinc-600 dark:border-zinc-800 dark:text-zinc-300"
        >
          <Icon name="menu" className="h-5 w-5" />
        </button>
      </header>

      {/* Sidebar fija en escritorio */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-zinc-200/80 bg-white/60 backdrop-blur-xl lg:block dark:border-zinc-800/60 dark:bg-zinc-950/50">
        {content}
      </aside>

      {/* Drawer en móvil */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm"
          />
          <aside className="animate-fade-in absolute inset-y-0 left-0 w-[min(18rem,85vw)] border-r border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Cerrar menú"
              className="absolute top-5 right-3 rounded-md p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
