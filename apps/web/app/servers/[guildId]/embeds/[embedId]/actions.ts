"use server";

import { redirect } from "next/navigation";
import { deleteEmbed } from "@hubbert/modules";
import { getGuildAccess } from "@/lib/guild-access";

export async function deleteEmbedAction(guildId: string, embedId: string) {
  const access = await getGuildAccess(guildId);
  if (!access.ok) return;

  await deleteEmbed(guildId, embedId);
  redirect(`/servers/${guildId}/embeds`);
}
