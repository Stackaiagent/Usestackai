import Link from "next/link";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { UserMenu } from "@/components/user-menu";
import { KeysClient, type KeyView } from "./keys-client";

const TIER_LIMITS: Record<string, number | null> = {
  free: 50,
  builder: 200,
  unlimited: null,
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const tier = session?.user?.tier ?? "free";
  const limit = TIER_LIMITS[tier] ?? null;

  const { data: keyRows } = await supabaseAdmin
    .from("api_keys")
    .select("id, name, key_prefix, last_used_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const keys = keyRows ?? [];

  // Today's usage per key (from the usage table).
  const { data: usageRows } = await supabaseAdmin
    .from("usage")
    .select("key_id, count")
    .in(
      "key_id",
      keys.map((k) => k.id),
    )
    .eq("date", today());

  const usageByKey = new Map<string, number>(
    (usageRows ?? []).map((u) => [u.key_id as string, u.count as number]),
  );

  const views: KeyView[] = keys.map((k) => ({
    id: k.id,
    name: k.name,
    prefix: k.key_prefix,
    lastUsedAt: k.last_used_at,
    createdAt: k.created_at,
    usedToday: usageByKey.get(k.id) ?? 0,
    limit,
  }));

  const handle = session?.user?.username
    ? `@${session.user.username}`
    : (session?.user?.name ?? "—");

  return (
    <main>
      {/* top bar */}
      <nav className="flex items-center justify-between border-b border-[#1c1c1c] px-6 py-4">
        <Link href="/" className="font-mono text-sm font-bold">
          Stack<span className="text-[#e8ff47]">AI</span>
        </Link>
        <UserMenu />
      </nav>

      <div className="mx-auto max-w-3xl px-6 py-12">
        <header className="mb-10 flex items-center gap-3">
          {session?.user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt=""
              width={44}
              height={44}
              style={{ borderRadius: "50%" }}
            />
          ) : null}
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="mt-1 font-mono text-xs uppercase tracking-wider text-[#888]">
              {handle} · {tier} tier
            </p>
          </div>
        </header>

        <KeysClient initialKeys={views} />
      </div>
    </main>
  );
}
