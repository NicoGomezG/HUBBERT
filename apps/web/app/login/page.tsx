"use client";

import Image from "next/image";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  async function handleLogin() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        scopes: "identify guilds",
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-zinc-50 p-4 sm:p-8 dark:bg-black">
      <div aria-hidden className="app-backdrop" />
      <div className="relative flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-zinc-200 bg-white/70 p-8 text-center shadow-xl shadow-zinc-900/5 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/60 dark:shadow-black/40">
        <Image src="/logo.png" alt="Hubbert" width={72} height={72} priority />
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Hubbert
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Inicia sesión para administrar los servidores donde tienes permisos.
        </p>
        <button
          onClick={handleLogin}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-[#5865F2] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4752C4]"
        >
          Continuar con Discord
        </button>
      </div>
    </main>
  );
}
