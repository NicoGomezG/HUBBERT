const MERCADOPAGO_URL = "https://mpago.la/2w2FyRs";

const SUGGESTED_AMOUNTS = ["$2.000", "$5.000", "$10.000", "$20.000"] as const;

export default function DonacionesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Donaciones
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Hubbert es gratis y se mantiene con el aporte de la comunidad. Si te sirve, considera invitar un cafecito.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-md border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Montos sugeridos
        </h3>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_AMOUNTS.map((amount) => (
            <span
              key={amount}
              className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-300"
            >
              {amount} CLP
            </span>
          ))}
        </div>

        <a
          href={MERCADOPAGO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-[#00b1ea] px-4 py-2 text-sm font-medium text-white hover:bg-[#0092c4]"
        >
          Donar con Mercado Pago
        </a>
      </div>

      <div className="rounded-md border border-dashed border-zinc-200 p-5 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        Muy pronto: PayPal para donaciones desde el extranjero.
      </div>
    </div>
  );
}
