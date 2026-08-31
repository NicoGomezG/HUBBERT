import { NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { sendDueBirthdayNotifications } from "@hubbert/modules";

// Disparado por QStash (POST, firmado) con cron timezone-aware
// ("CRON_TZ=America/Santiago ...") en vez de Vercel Cron, que solo
// garantiza el minuto exacto en UTC y puede atrasarse hasta ~59 min.
// El GET con CRON_SECRET se mantiene para pruebas manuales (curl).
export async function POST(request: Request) {
  const signature = request.headers.get("upstash-signature");
  if (!signature) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "" } }, { status: 401 });
  }

  const body = await request.text();
  const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
  });

  const valid = await receiver
    .verify({ signature, body, url: request.url })
    .catch(() => false);

  if (!valid) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "" } }, { status: 401 });
  }

  const summary = await sendDueBirthdayNotifications();
  return NextResponse.json({ success: true, data: summary });
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "" } }, { status: 401 });
    }
  }

  const summary = await sendDueBirthdayNotifications();
  return NextResponse.json({ success: true, data: summary });
}
