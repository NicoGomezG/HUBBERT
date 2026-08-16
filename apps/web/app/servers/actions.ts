"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@hubbert/db";
import { fetchBotGuildIds } from "@hubbert/discord";

/**
 * Re-chequea en qué guilds está el bot ahora mismo (con el token del bot,
 * sin depender del OAuth token del usuario, que no persistimos). Sirve
 * para no tener que cerrar/abrir sesión después de invitar el bot.
 */
export async function refreshBotPresence() {
  const botGuildIds = await fetchBotGuildIds();
  const guilds = await prisma.guild.findMany();

  for (const guild of guilds) {
    const installed = botGuildIds.has(guild.id);
    if (installed !== Boolean(guild.botInstalledAt)) {
      await prisma.guild.update({
        where: { id: guild.id },
        data: { botInstalledAt: installed ? new Date() : null },
      });
    }
  }

  revalidatePath("/servers");
}
