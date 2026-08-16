import {
  birthdayInputSchema,
  BirthdayDuplicateError,
  createBirthday,
  listBirthdays,
} from "@hubbert/modules";
import { getGuildAccess } from "@/lib/guild-access";
import { apiError, apiSuccess, guildAccessErrorResponse } from "@/lib/api-response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params;
  const access = await getGuildAccess(guildId);
  if (!access.ok) return guildAccessErrorResponse(access.reason);

  const birthdays = await listBirthdays(guildId);
  return apiSuccess(birthdays);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params;
  const access = await getGuildAccess(guildId);
  if (!access.ok) return guildAccessErrorResponse(access.reason);

  const json = await request.json().catch(() => null);
  const parsed = birthdayInputSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Datos inválidos.", 400);
  }

  try {
    const birthday = await createBirthday(guildId, access.userId, parsed.data);
    return apiSuccess(birthday, 201);
  } catch (err) {
    if (err instanceof BirthdayDuplicateError) {
      return apiError("DUPLICATE", "Ese miembro ya tiene un cumpleaños registrado.", 409);
    }
    throw err;
  }
}
