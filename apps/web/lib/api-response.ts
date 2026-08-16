import { NextResponse } from "next/server";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

export function guildAccessErrorResponse(reason: "unauthenticated" | "not_member" | "bot_not_installed") {
  switch (reason) {
    case "unauthenticated":
      return apiError("UNAUTHENTICATED", "Necesitás iniciar sesión.", 401);
    case "not_member":
      return apiError(
        "GUILD_ACCESS_DENIED",
        "No tenés permisos para administrar este servidor.",
        403
      );
    case "bot_not_installed":
      return apiError(
        "BOT_NOT_INSTALLED",
        "El bot no está instalado en este servidor.",
        409
      );
  }
}
