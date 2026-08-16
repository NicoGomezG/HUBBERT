import {
  birthdayInputSchema,
  BirthdayDuplicateError,
  BirthdayNotFoundError,
  deleteBirthday,
  updateBirthday,
} from "@hubbert/modules";
import { getGuildAccess } from "@/lib/guild-access";
import { apiError, apiSuccess, guildAccessErrorResponse } from "@/lib/api-response";

type Params = { params: Promise<{ guildId: string; birthdayId: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { guildId, birthdayId } = await params;
  const access = await getGuildAccess(guildId);
  if (!access.ok) return guildAccessErrorResponse(access.reason);

  const json = await request.json().catch(() => null);
  const parsed = birthdayInputSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Datos inválidos.", 400);
  }

  try {
    const birthday = await updateBirthday(guildId, birthdayId, parsed.data);
    return apiSuccess(birthday);
  } catch (err) {
    if (err instanceof BirthdayNotFoundError) {
      return apiError("NOT_FOUND", "Cumpleaños no encontrado.", 404);
    }
    if (err instanceof BirthdayDuplicateError) {
      return apiError("DUPLICATE", "Ese miembro ya tiene un cumpleaños registrado.", 409);
    }
    throw err;
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { guildId, birthdayId } = await params;
  const access = await getGuildAccess(guildId);
  if (!access.ok) return guildAccessErrorResponse(access.reason);

  try {
    await deleteBirthday(guildId, birthdayId);
    return apiSuccess({ deleted: true });
  } catch (err) {
    if (err instanceof BirthdayNotFoundError) {
      return apiError("NOT_FOUND", "Cumpleaños no encontrado.", 404);
    }
    throw err;
  }
}
