"use server";

import { revalidatePath } from "next/cache";
import { closeTicket, deletePanel } from "@hubbert/modules";
import { getGuildAccess } from "@/lib/guild-access";

export async function deletePanelAction(guildId: string, panelId: string) {
  const access = await getGuildAccess(guildId);
  if (!access.ok) return;

  await deletePanel(guildId, panelId);
  revalidatePath(`/servers/${guildId}/tickets`);
}

export async function closeTicketAction(guildId: string, channelId: string) {
  const access = await getGuildAccess(guildId);
  if (!access.ok) return;

  // getGuildAccess ya exige permiso de administración para llegar hasta acá.
  await closeTicket(channelId, access.discordId, true);
  revalidatePath(`/servers/${guildId}/tickets`);
}
