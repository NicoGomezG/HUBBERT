import { NextResponse } from "next/server";
import { prisma } from "@hubbert/db";
import { syncUserGuilds } from "@hubbert/modules";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const { user, session } = data;
  const metadata = user.user_metadata as Record<string, unknown>;
  const customClaims = metadata.custom_claims as { global_name?: string } | undefined;

  const discordId = String(metadata.provider_id ?? metadata.sub ?? "");
  const username = String(customClaims?.global_name ?? metadata.full_name ?? "Usuario Discord");
  const avatarUrl = typeof metadata.avatar_url === "string" ? metadata.avatar_url : null;

  if (!discordId) {
    return NextResponse.redirect(`${origin}/login?error=missing_discord_id`);
  }

  const dbUser = await prisma.user.upsert({
    where: { discordId },
    create: { discordId, username, avatarUrl },
    update: { username, avatarUrl, lastLoginAt: new Date() },
  });

  // provider_token solo está disponible en este instante — nunca se persiste.
  if (session.provider_token) {
    await syncUserGuilds(dbUser.id, discordId, session.provider_token);
  }

  return NextResponse.redirect(`${origin}/servers`);
}
