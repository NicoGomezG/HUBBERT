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

  return <WelcomeForm guildId={guildId} guildName={access.ok ? access.guild.name : "tu servidor"} initial={settings} />;
}
