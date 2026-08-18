import { NextResponse } from "next/server";
import { registerGlobalCommands } from "@hubbert/discord";

// Disparar manualmente una vez después de deployar (o de nuevo si se agregan
// comandos): curl -X POST .../api/discord/register-commands -H "Authorization: Bearer $CRON_SECRET"
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "" } }, { status: 401 });
    }
  }

  const applicationId = process.env.DISCORD_CLIENT_ID;
  if (!applicationId) {
    return NextResponse.json({ success: false, error: { code: "NOT_CONFIGURED", message: "" } }, { status: 500 });
  }

  await registerGlobalCommands(applicationId);
  return NextResponse.json({ success: true, data: null });
}
