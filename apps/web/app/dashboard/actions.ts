"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { generateApiKey, hashApiKey, keyPrefix } from "@/lib/keys";

export interface CreateKeyResult {
  /** Full key — shown to the user exactly once. */
  fullKey: string;
  name: string;
}

/** Create a new API key for the signed-in user. Returns the raw key once. */
export async function createKey(name: string): Promise<CreateKeyResult> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const fullKey = generateApiKey();
  const { error } = await supabaseAdmin.from("api_keys").insert({
    user_id: session.user.id,
    name: name.trim() || "Default",
    key_hash: hashApiKey(fullKey),
    key_prefix: keyPrefix(fullKey),
  });
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  return { fullKey, name: name.trim() || "Default" };
}

/** Revoke (delete) a key owned by the signed-in user. */
export async function revokeKey(keyId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const { error } = await supabaseAdmin
    .from("api_keys")
    .delete()
    .eq("id", keyId)
    .eq("user_id", session.user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
}
