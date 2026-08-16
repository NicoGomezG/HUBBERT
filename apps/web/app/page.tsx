import { checkDatabaseConnection } from "@/lib/health";

export default async function Home() {
  const db = await checkDatabaseConnection();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 p-8 font-sans dark:bg-black">
      <div className="flex w-full max-w-md flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Hubbert
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Paso 0 — scaffold del monorepo. Esta página confirma que la cadena
          app → Prisma → Postgres (Supabase) funciona de punta a punta.
        </p>
        <div className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800">
          <span
            className={`h-2 w-2 rounded-full ${
              db.ok ? "bg-emerald-500" : "bg-red-500"
            }`}
          />
          <span className="font-medium">
            {db.ok ? "Base de datos conectada" : "Base de datos no disponible"}
          </span>
        </div>
        {!db.ok && (
          <p className="text-xs text-red-600 dark:text-red-400">
            {db.error}
          </p>
        )}
      </div>
    </main>
  );
}
