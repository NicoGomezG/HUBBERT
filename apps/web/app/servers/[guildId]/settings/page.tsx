import { getGuildSettings } from "@hubbert/modules";
import { fetchGuildTextChannels } from "@hubbert/discord";
import { SettingsForm } from "@/components/settings/SettingsForm";

const COMMON_TIMEZONES = [
  "UTC",
  "America/Santiago",
  "America/Argentina/Buenos_Aires",
  "America/Mexico_City",
  "America/Bogota",
  "America/Lima",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/Madrid",
  "Europe/London",
];

function getTimezones(): string[] {
  const supported =
    typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
  const merged = new Set([...COMMON_TIMEZONES, ...supported]);
  return [...merged].sort();
}

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const [settings, channels] = await Promise.all([
    getGuildSettings(guildId),
    fetchGuildTextChannels(guildId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Configuración</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Ajustes generales de este servidor.
        </p>
      </div>
      <SettingsForm
        guildId={guildId}
        timezones={getTimezones()}
        channels={channels}
        initialTimezone={settings.timezone}
        initialChannelId={settings.defaultChannelId}
      />
    </div>
  );
}
