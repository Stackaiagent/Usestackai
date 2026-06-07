import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;
if (!url || !key) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_KEY are required");
}

/** Service-role client (bypasses RLS) — server-side only. */
const db = createClient(url, key, { auth: { persistSession: false } });

export interface BotUser {
  id: string;
  x_username: string;
  tier: string;
  telegram_id: string | null;
}

/** Find the StackAI user linked to a Telegram id, or null if unlinked. */
export async function getUserByTelegramId(
  telegramId: string,
): Promise<BotUser | null> {
  const { data } = await db
    .from("users")
    .select("id, x_username, tier, telegram_id")
    .eq("telegram_id", telegramId)
    .maybeSingle<BotUser>();
  return data ?? null;
}

/** Create a one-time link code for a Telegram user (replaces any prior code). */
export async function createLinkCode(
  code: string,
  telegramId: string,
  username: string | null,
): Promise<void> {
  await db.from("telegram_link_codes").delete().eq("telegram_id", telegramId);
  const { error } = await db.from("telegram_link_codes").insert({
    code,
    telegram_id: telegramId,
    telegram_username: username,
  });
  if (error) throw new Error(error.message);
}
