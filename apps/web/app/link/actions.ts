"use server";

import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";

interface LinkResult {
  ok: boolean;
  message: string;
}

const CODE_TTL_MS = 15 * 60 * 1000;

/** Consume a Telegram link code and attach its telegram_id to the signed-in user. */
export async function linkTelegram(code: string): Promise<LinkResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, message: "You're not signed in." };
  if (!code) return { ok: false, message: "Missing link code." };

  const { data: row } = await supabaseAdmin
    .from("telegram_link_codes")
    .select("telegram_id, telegram_username, created_at")
    .eq("code", code)
    .maybeSingle<{
      telegram_id: string;
      telegram_username: string | null;
      created_at: string;
    }>();

  if (!row) {
    return { ok: false, message: "Invalid or already-used link code. Run /link again in Telegram." };
  }
  if (Date.now() - new Date(row.created_at).getTime() > CODE_TTL_MS) {
    await supabaseAdmin.from("telegram_link_codes").delete().eq("code", code);
    return { ok: false, message: "This link code expired. Run /link again in Telegram." };
  }

  const { error } = await supabaseAdmin
    .from("users")
    .update({ telegram_id: row.telegram_id })
    .eq("id", session.user.id);

  if (error) {
    const dup = /duplicate|unique/i.test(error.message);
    return {
      ok: false,
      message: dup
        ? "This Telegram account is already linked to another StackAI user."
        : "Failed to link. Please try again.",
    };
  }

  await supabaseAdmin.from("telegram_link_codes").delete().eq("code", code);
  return {
    ok: true,
    message: `Linked${row.telegram_username ? " @" + row.telegram_username : ""}! Head back to Telegram and start chatting.`,
  };
}
