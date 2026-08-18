import { NextResponse } from "next/server";
import { sendMonthlyBirthdaySummary } from "@hubbert/modules";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "" } }, { status: 401 });
    }
  }

  const summary = await sendMonthlyBirthdaySummary();
  return NextResponse.json({ success: true, data: summary });
}
