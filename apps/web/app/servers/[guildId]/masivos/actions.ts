"use server";

import { revalidatePath } from "next/cache";
import { cancelBroadcast } from "@hubbert/modules";
import { getGuildAccess } from "@/lib/guild-access";

export async function cancelBroadcastAction(guildId: string, broadcastId: string) {
  const access = await getGuildAccess(guildId);
  if (!access.ok) return;

  await cancelBroadcast(guildId, broadcastId);
  revalidatePath(`/servers/${guildId}/masivos`);
}
