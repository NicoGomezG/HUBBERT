// Se muestra al instante al cambiar de sección mientras el servidor trae los
// datos. Next lo prefetchea junto con el link, así el clic responde altiro.
export default function ServersLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-8" aria-busy="true" aria-label="Cargando">
      <div className="flex items-center gap-4 border-b border-zinc-200/80 pb-6 dark:border-zinc-800/70">
        <div className="h-12 w-12 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="flex flex-col gap-2">
          <div className="h-2.5 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-5 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-64 max-w-full rounded bg-zinc-200/70 dark:bg-zinc-800/70" />
          </div>
          <div className="hidden h-9 w-28 rounded-md bg-zinc-200 sm:block dark:bg-zinc-800" />
        </div>
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-16 rounded-md border border-zinc-200 bg-white/60 dark:border-zinc-800 dark:bg-zinc-950/60"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
