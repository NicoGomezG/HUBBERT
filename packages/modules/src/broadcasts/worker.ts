import { prisma } from "@hubbert/db";
import { sendDirectMessage, translateDiscordError } from "@hubbert/discord";
import { ACTIVE_BROADCAST_STATUSES } from "./service";

/**
 * Cola de DMs masivos. Corre dentro de apps/gateway (proceso siempre
 * encendido) porque un envío a cientos de miembros no cabe en el tiempo de
 * una función serverless.
 *
 * Para no gatillar el antispam de Discord manda un DM a la vez, con una pausa
 * de 3 a 5 segundos entre cada uno (~900 por hora). Los 429 los espera solo
 * @discordjs/rest; si Discord responde 40003 (DMs demasiado rápidos) la cola
 * se detiene un rato y reintenta el mismo destinatario.
 */

const DELAY_MS = 3_000;
const JITTER_MS = 2_000;
const IDLE_MS = 10_000;
const DM_THROTTLED_PAUSE_MS = 10 * 60_000;
const MAX_ATTEMPTS = 3;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function errorInfo(err: unknown): { code?: number; status?: number } {
  const e = err as { code?: unknown; status?: unknown };
  return {
    code: typeof e.code === "number" ? e.code : undefined,
    status: typeof e.status === "number" ? e.status : undefined,
  };
}

/** Manda un DM del envío activo más antiguo. Devuelve "idle" si no hay nada en cola. */
async function processNext(): Promise<"sent" | "idle" | "throttled"> {
  const broadcast = await prisma.dmBroadcast.findFirst({
    where: { status: { in: ACTIVE_BROADCAST_STATUSES } },
    orderBy: { createdAt: "asc" },
  });
  if (!broadcast) return "idle";

  if (broadcast.status === "pending") {
    await prisma.dmBroadcast.update({
      where: { id: broadcast.id },
      data: { status: "sending", startedAt: new Date() },
    });
  }

  // Los que ya fallaron alguna vez quedan al final, así un error pasajero no frena al resto.
  const recipient = await prisma.dmBroadcastRecipient.findFirst({
    where: { broadcastId: broadcast.id, status: "pending" },
    orderBy: [{ attempts: "asc" }, { id: "asc" }],
  });

  if (!recipient) {
    // updateMany con el estado en el where: si lo cancelaron justo ahora, queda cancelado.
    await prisma.dmBroadcast.updateMany({
      where: { id: broadcast.id, status: "sending" },
      data: { status: "done", finishedAt: new Date() },
    });
    return "idle";
  }

  try {
    await sendDirectMessage(recipient.discordUserId, { embeds: [broadcast.payload as object] });
    await prisma.dmBroadcastRecipient.update({
      where: { id: recipient.id },
      data: { status: "sent", sentAt: new Date(), attempts: { increment: 1 }, error: null },
    });
    return "sent";
  } catch (err) {
    const { code, status } = errorInfo(err);

    if (code === 40003) {
      console.warn(`[broadcasts] Discord frenó los DMs (envío ${broadcast.id}); pausa de ${DM_THROTTLED_PAUSE_MS / 60_000} min`);
      return "throttled";
    }

    // 50007: DMs cerrados. Cualquier otro 4xx tampoco se arregla reintentando.
    const attempts = recipient.attempts + 1;
    const final = code === 50007 || (status !== undefined && status >= 400 && status < 500) || attempts >= MAX_ATTEMPTS;
    await prisma.dmBroadcastRecipient.update({
      where: { id: recipient.id },
      data: {
        attempts,
        status: code === 50007 ? "closed" : final ? "failed" : "pending",
        error: translateDiscordError(err).slice(0, 500),
      },
    });
    return "sent";
  }
}

export async function runBroadcastWorker(signal?: AbortSignal): Promise<void> {
  while (!signal?.aborted) {
    let result: Awaited<ReturnType<typeof processNext>> = "idle";
    try {
      result = await processNext();
    } catch (err) {
      console.error("[broadcasts] error procesando la cola:", err);
    }

    if (result === "sent") await sleep(DELAY_MS + Math.random() * JITTER_MS);
    else if (result === "throttled") await sleep(DM_THROTTLED_PAUSE_MS);
    else await sleep(IDLE_MS);
  }
}
