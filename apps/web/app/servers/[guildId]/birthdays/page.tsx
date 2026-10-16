import Link from "next/link";
import { getGuildSettings, listBirthdays } from "@hubbert/modules";
import { fetchGuildTextChannels } from "@hubbert/discord";
import { deleteBirthdayAction, toggleActiveAction } from "./actions";
import { ListCard, ListRow } from "@/components/ui/ListRow";
import { BirthdayMonths } from "@/components/birthdays/BirthdayMonths";

// Con más cumpleaños que esto, la lista se agrupa por mes.
const GROUP_BY_MONTH_FROM = 10;

/** Fecha de hoy en la zona horaria del servidor, para que "Hoy" coincida con cuándo se envía la felicitación. */
function todayIn(timeZone: string) {
  const format = (tz: string) =>
    new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(
      new Date()
    );
  let parts;
  try {
    parts = format(timeZone);
  } catch {
    parts = format("UTC");
  }
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { day: get("day"), month: get("month"), year: get("year") };
}

export default async function BirthdaysPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const [birthdays, channels, settings] = await Promise.all([
    listBirthdays(guildId),
    fetchGuildTextChannels(guildId),
    getGuildSettings(guildId),
  ]);
  const channelName = (id: string | null) =>
    id ? (channels.find((c) => c.id === id)?.name ?? "canal eliminado") : "por defecto";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Cumpleaños</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Se felicitan automáticamente el día que corresponde.
          </p>
        </div>
        <Link
          href={`/servers/${guildId}/birthdays/new`}
          className="rounded-md bg-[#5865F2] px-3 py-2 text-sm font-medium text-white hover:bg-[#4752C4]"
        >
          + Nuevo cumpleaños
        </Link>
      </div>

      {birthdays.length === 0 && (
        <p className="rounded-md border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Todavía no registraste ningún cumpleaños.
        </p>
      )}

      {birthdays.length > GROUP_BY_MONTH_FROM && (
        <BirthdayMonths
          guildId={guildId}
          today={todayIn(settings.timezone)}
          birthdays={birthdays.map((b) => ({
            id: b.id,
            displayName: b.displayName,
            day: b.day,
            month: b.month,
            year: b.year,
            channelLabel: channelName(b.channelId),
            isActive: b.isActive,
            toggleAction: toggleActiveAction.bind(null, guildId, b.id),
            deleteAction: deleteBirthdayAction.bind(null, guildId, b.id),
          }))}
        />
      )}

      {birthdays.length > 0 && birthdays.length <= GROUP_BY_MONTH_FROM && (
        <ListCard>
          {birthdays.map((b) => (
            <ListRow
              key={b.id}
              day={b.day}
              month={b.month}
              title={b.displayName}
              meta={`${b.year ? `Nació en ${b.year} · ` : ""}#${channelName(b.channelId)}`}
              isActive={b.isActive}
              toggleAction={toggleActiveAction.bind(null, guildId, b.id)}
              deleteAction={deleteBirthdayAction.bind(null, guildId, b.id)}
              editHref={`/servers/${guildId}/birthdays/${b.id}`}
            />
          ))}
        </ListCard>
      )}
    </div>
  );
}
