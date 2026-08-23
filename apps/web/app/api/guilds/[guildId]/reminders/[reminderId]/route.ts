import {
  reminderInputSchema,
  ReminderNotFoundError,
  deleteReminder,
  updateReminder,
} from "@hubbert/modules";
import { getGuildAccess } from "@/lib/guild-access";
import { apiError, apiSuccess, guildAccessErrorResponse } from "@/lib/api-response";

type Params = { params: Promise<{ guildId: string; reminderId: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { guildId, reminderId } = await params;
  const access = await getGuildAccess(guildId);
  if (!access.ok) return guildAccessErrorResponse(access.reason);

  const json = await request.json().catch(() => null);
  const parsed = reminderInputSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Datos inválidos.", 400);
  }

  try {
    const reminder = await updateReminder(guildId, reminderId, parsed.data);
    return apiSuccess(reminder);
  } catch (err) {
    if (err instanceof ReminderNotFoundError) {
      return apiError("NOT_FOUND", "Recordatorio no encontrado.", 404);
    }
    throw err;
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { guildId, reminderId } = await params;
  const access = await getGuildAccess(guildId);
  if (!access.ok) return guildAccessErrorResponse(access.reason);

  try {
    await deleteReminder(guildId, reminderId);
    return apiSuccess({ deleted: true });
  } catch (err) {
    if (err instanceof ReminderNotFoundError) {
      return apiError("NOT_FOUND", "Recordatorio no encontrado.", 404);
    }
    throw err;
  }
}
