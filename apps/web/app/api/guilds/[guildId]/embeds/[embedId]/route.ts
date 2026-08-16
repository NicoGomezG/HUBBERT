import {
  deleteEmbed,
  embedInputSchema,
  EmbedNotFoundError,
  getEmbed,
  updateEmbed,
} from "@hubbert/modules";
import { getGuildAccess } from "@/lib/guild-access";
import { apiError, apiSuccess, guildAccessErrorResponse } from "@/lib/api-response";

type Params = { params: Promise<{ guildId: string; embedId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { guildId, embedId } = await params;
  const access = await getGuildAccess(guildId);
  if (!access.ok) return guildAccessErrorResponse(access.reason);

  try {
    const embed = await getEmbed(guildId, embedId);
    return apiSuccess(embed);
  } catch (err) {
    if (err instanceof EmbedNotFoundError) {
      return apiError("NOT_FOUND", "Embed no encontrado.", 404);
    }
    throw err;
  }
}

export async function PUT(request: Request, { params }: Params) {
  const { guildId, embedId } = await params;
  const access = await getGuildAccess(guildId);
  if (!access.ok) return guildAccessErrorResponse(access.reason);

  const json = await request.json().catch(() => null);
  const parsed = embedInputSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Datos inválidos.", 400);
  }

  try {
    const embed = await updateEmbed(guildId, embedId, parsed.data);
    return apiSuccess(embed);
  } catch (err) {
    if (err instanceof EmbedNotFoundError) {
      return apiError("NOT_FOUND", "Embed no encontrado.", 404);
    }
    throw err;
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { guildId, embedId } = await params;
  const access = await getGuildAccess(guildId);
  if (!access.ok) return guildAccessErrorResponse(access.reason);

  try {
    await deleteEmbed(guildId, embedId);
    return apiSuccess({ deleted: true });
  } catch (err) {
    if (err instanceof EmbedNotFoundError) {
      return apiError("NOT_FOUND", "Embed no encontrado.", 404);
    }
    throw err;
  }
}
