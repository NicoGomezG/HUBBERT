import { getWelcomeSettings } from "@hubbert/modules";
import { getGuildAccess } from "@/lib/guild-access";
import { WelcomeForm } from "@/components/welcome/WelcomeForm";

export default async function WelcomePage({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  // El layout ya validó el acceso; acá solo se usa para el nombre del servidor en la vista previa.
  const [settings, access] = await Promise.all([getWelcomeSettings(guildId), getGuildAccess(guildId)]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Bienvenida y despedida</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Mensajes automáticos cuando alguien entra o sale del servidor.
        </p>
      </div>
      <WelcomeForm guildId={guildId} guildName={access.ok ? access.guild.name : "tu servidor"} initial={settings} />
    </div>
  );
}
