import { DonateButton, SuggestionForm } from "@/components/suggestions/SuggestionForm";
import { SUGGESTED_AMOUNTS } from "@/lib/donations";

export default async function SugerenciasPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Sugerencias</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          ¿Se te ocurre algo que le falta a Hubbert o encontraste un error? Cuéntalo acá.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <SuggestionForm guildId={guildId} />

        <aside className="flex flex-col gap-4 self-start rounded-xl border border-rose-500/20 bg-gradient-to-b from-rose-500/[0.06] to-transparent p-5 xl:sticky xl:top-6 dark:border-rose-400/20 dark:from-rose-400/[0.08]">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Ayuda a que tu idea se haga realidad</p>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              Hubbert es gratis y lo desarrolla una sola persona en su tiempo libre. Cada donación se traduce en horas
              para construir lo que la comunidad pide.
            </p>
          </div>
          <ul className="flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            <li className="flex gap-2">
              <span aria-hidden className="text-rose-500">♥</span>
              Las ideas con apoyo llegan destacadas y se revisan primero.
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="text-rose-500">♥</span>
              Mantienes el bot gratis para todos los servidores.
            </li>
          </ul>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_AMOUNTS.map((amount) => (
              <span
                key={amount}
                className="rounded-full border border-zinc-200 bg-white/60 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-300"
              >
                {amount} CLP
              </span>
            ))}
          </div>
          <DonateButton />
        </aside>
      </div>
    </div>
  );
}
