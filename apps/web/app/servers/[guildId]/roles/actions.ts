"use server";

import { revalidatePath } from "next/cache";
import { deleteReactionRolePanel } from "@hubbert/modules";
import { getGuildAccess } from "@/lib/guild-access";

export async function deleteReactionRolePanelAction(guildId: string, panelId: string) {
  const access = await getGuildAccess(guildId);
  if (!access.ok) return;

  await deleteReactionRolePanel(guildId, panelId);
  revalidatePath(`/servers/${guildId}/roles`);
}
