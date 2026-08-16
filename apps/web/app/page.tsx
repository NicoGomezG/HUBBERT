import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const FEATURES = [
  {
    title: "Embeds",
    description:
      "Diseña y envía mensajes con embeds personalizados a cualquier canal de tu servidor.",
  },
  {
    title: "Cumpleaños",
    description:
      "Registrá los cumpleaños de tus miembros y Hubbert los felicita automáticamente.",
  },
  {
    title: "Configuración",
    description:
      "Administrá los ajustes del bot por servidor desde un panel centralizado.",
  },
] as const;

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/servers");
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-16 bg-zinc-50 px-8 py-20 dark:bg-black">
      <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
        <Image src="/logo.png" alt="Hubbert" width={72} height={72} priority />
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Hubbert
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          El panel para administrar Hubbert en tus servidores de Discord:
          embeds, cumpleaños y configuración, todo en un solo lugar.
        </p>
        <Link
          href="/login"
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-[#5865F2] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4752C4]"
        >
          Conectar con Discord
        </Link>
      </div>

      <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="flex flex-col gap-1.5 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {feature.title}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
