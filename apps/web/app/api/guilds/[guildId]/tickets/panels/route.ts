import { createPanel, listPanels, ticketPanelInputSchema } from "@hubbert/modules";
import { getGuildAccess } from "@/lib/guild-access";
import { apiError, apiSuccess, guildAccessErrorResponse } from "@/lib/api-response";

export async function GET(_request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const access = await getGuildAccess(guildId);
  if (!access.ok) return guildAccessErrorResponse(access.reason);

  const panels = await listPanels(guildId);
  return apiSuccess(panels);
}

export async function POST(request: Request, { params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  const access = await getGuildAccess(guildId);
  if (!access.ok) return guildAccessErrorResponse(access.reason);

  const json = await request.json().catch(() => null);
  const parsed = ticketPanelInputSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Datos inválidos.", 400);
  }

  try {
    const panel = await createPanel(guildId, access.userId, parsed.data);
    return apiSuccess(panel, 201);
  } catch (err) {
    return apiError(
      "DISCORD_ERROR",
      err instanceof Error ? err.message : "No se pudo publicar el panel en Discord.",
      502
    );
  }
}
