import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/lib/health";

export async function GET() {
  const db = await checkDatabaseConnection();

  if (!db.ok) {
    return NextResponse.json(
      { success: false, error: { code: "DATABASE_UNAVAILABLE", message: db.error } },
      { status: 503 }
    );
  }

  return NextResponse.json({ success: true, data: { database: "ok" } });
}
