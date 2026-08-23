import Image from "next/image";
import Link from "next/link";
import { Metal_Mania } from "next/font/google";

const metalMania = Metal_Mania({ weight: "400", subsets: ["latin"] });

export default function ServersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <Link href="/servers" className="flex items-center gap-2">
          <Image src="/logo.png" alt="" width={28} height={28} />
          <div className="flex flex-col leading-none">
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">Hubbert</span>
            <span className={`${metalMania.className} text-xs tracking-wide text-zinc-500 dark:text-zinc-400`}>
              made by NGZ
            </span>
          </div>
        </Link>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Cerrar sesión
          </button>
        </form>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>
    </div>
  );
}
