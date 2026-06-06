"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

/**
 * Auth-aware nav cluster shown on every page. Logged out → Sign in / Get
 * started. Logged in → avatar + @username + Home + Sign out.
 *
 * `landing` uses the landing page's own button classes (scoped under .landing);
 * the default uses Tailwind so it looks right on the app pages.
 */
export function UserMenu({ landing = false }: { landing?: boolean }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span style={{ width: 90, display: "inline-block" }} />;
  }

  const user = session?.user;

  // ── Logged out ──────────────────────────────────────────────
  if (!user) {
    if (landing) {
      return (
        <>
          <Link href="/login" className="btn-ghost">Sign in</Link>
          <Link href="/login" className="btn-accent">Get started</Link>
        </>
      );
    }
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="font-mono text-xs uppercase tracking-wider text-[#888] hover:text-white"
        >
          Sign in
        </Link>
        <Link
          href="/login"
          className="bg-[#e8ff47] px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-black"
        >
          Get started
        </Link>
      </div>
    );
  }

  // ── Logged in ───────────────────────────────────────────────
  const handle = user.username ? `@${user.username}` : (user.name ?? "account");

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/"
        className="font-mono text-[11px] uppercase tracking-wider text-[#888] hover:text-white"
      >
        Home
      </Link>
      <Link
        href="/dashboard"
        className="font-mono text-[11px] uppercase tracking-wider text-[#888] hover:text-white"
      >
        Dashboard
      </Link>
      <Link
        href="/dashboard"
        className="flex items-center gap-2 font-mono text-xs text-[#d4d4d4] hover:text-white"
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt=""
            width={24}
            height={24}
            style={{ borderRadius: "50%" }}
          />
        ) : (
          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "#e8ff47",
              display: "inline-block",
            }}
          />
        )}
        <span>{handle}</span>
      </Link>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="font-mono text-[11px] uppercase tracking-wider text-[#888] hover:text-red-400"
      >
        Sign out
      </button>
    </div>
  );
}
