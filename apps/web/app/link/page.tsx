import Link from "next/link";
import { auth } from "@/auth";
import { LinkButton } from "./link-button";

export const metadata = {
  title: "Link Telegram",
  description: "Connect your Telegram account to StackAI.",
};

export default async function LinkPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const session = await auth();

  return (
    <main className="mx-auto min-h-screen max-w-md px-6 py-20">
      <Link
        href="/"
        className="font-mono text-xs uppercase tracking-wider text-[#888] hover:text-white"
      >
        ← Stack<span className="text-[#e8ff47]">AI</span>
      </Link>

      <h1 className="mt-8 text-2xl font-bold text-white">Link Telegram</h1>

      {!code ? (
        <p className="mt-4 text-[#aaa]">
          No link code. In Telegram, send{" "}
          <code className="text-[#e8ff47]">/link</code> to the bot and open the
          link it gives you.
        </p>
      ) : !session?.user ? (
        <div className="mt-4 space-y-4">
          <p className="text-[#aaa]">Sign in with X to connect your Telegram.</p>
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(`/link?code=${code}`)}`}
            className="inline-block bg-[#e8ff47] px-5 py-2.5 font-semibold text-black"
          >
            Sign in with X
          </Link>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <p className="text-[#aaa]">
            Connect this Telegram to{" "}
            <strong className="text-white">
              @{session.user.username ?? "your account"}
            </strong>
            ?
          </p>
          <LinkButton code={code} />
        </div>
      )}
    </main>
  );
}
