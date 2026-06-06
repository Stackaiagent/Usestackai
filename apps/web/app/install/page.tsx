import Link from "next/link";
import { CodeBlock } from "./code-block";
import { UserMenu } from "@/components/user-menu";

export const metadata = {
  title: "Install · StackAI",
  description: "Install the StackAI CLI and start coding with AI in your terminal.",
};

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-[#1c1c1c] py-8">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center bg-[#e8ff47] font-mono text-sm font-bold text-black">
          {n}
        </span>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="space-y-3 pl-10">{children}</div>
    </section>
  );
}

export default function InstallPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-14">
      {/* header */}
      <div className="mb-2 flex items-center justify-between">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-wider text-[#888] hover:text-white"
        >
          ← Stack<span className="text-[#e8ff47]">AI</span>
        </Link>
        <UserMenu />
      </div>

      <h1 className="mt-8 text-4xl font-bold tracking-tight">
        Install the CLI
      </h1>
      <p className="mt-3 text-[#b0b0b0]">
        Get StackAI running in your terminal in under a minute. Requires{" "}
        <span className="text-white">Node.js 20+</span>.
      </p>

      <Step n={1} title="Install globally">
        <p className="text-sm text-[#b0b0b0]">
          Install the CLI from npm. This gives you the <code>stackai</code>{" "}
          command everywhere.
        </p>
        <CodeBlock code="npm install -g stackai" label="$" />
        <p className="font-mono text-xs text-[#5a5a5a]">
          Verify: <span className="text-[#888]">stackai --version</span>
        </p>
      </Step>

      <Step n={2} title="Get your API key">
        <p className="text-sm text-[#b0b0b0]">
          Sign in with X and create a key from your dashboard. Copy it — it&apos;s
          shown only once.
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-[#e8ff47] px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-black"
        >
          Open dashboard →
        </Link>
        <p className="font-mono text-xs text-[#5a5a5a]">
          Keys look like <span className="text-[#888]">sk_live_4a8f3c2e1b9d7e5f</span>
        </p>
      </Step>

      <Step n={3} title="Authenticate">
        <p className="text-sm text-[#b0b0b0]">
          Save your key locally (stored in{" "}
          <code className="text-[#888]">~/.stackai/config.json</code>).
        </p>
        <CodeBlock code="stackai login" label="$" />
        <p className="font-mono text-xs text-[#5a5a5a]">
          Check it: <span className="text-[#888]">stackai whoami</span>
        </p>
      </Step>

      <Step n={4} title="Start coding">
        <p className="text-sm text-[#b0b0b0]">
          Open an interactive session — like a chat, with full context across
          messages:
        </p>
        <CodeBlock code="stackai" label="$" />
        <p className="pt-2 text-sm text-[#b0b0b0]">
          Or run a single task and exit:
        </p>
        <CodeBlock code={`stackai "add input validation to all routes"`} label="$" />
      </Step>

      {/* command reference */}
      <section className="border-t border-[#1c1c1c] py-8">
        <h2 className="mb-4 text-lg font-semibold">Command reference</h2>
        <div className="overflow-hidden border border-[#1c1c1c]">
          <table className="w-full font-mono text-xs">
            <tbody>
              {[
                ["stackai", "Start an interactive chat session"],
                ["stackai \"<prompt>\"", "Run the agent once, then exit"],
                ["stackai login", "Log in (prompts for your API key)"],
                ["stackai whoami", "Show current user + usage today"],
                ["stackai --help", "Show all commands"],
                ["stackai --version", "Print the version"],
              ].map(([cmd, desc]) => (
                <tr key={cmd} className="border-b border-[#141414] last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-[#e8ff47]">
                    {cmd}
                  </td>
                  <td className="px-4 py-3 text-[#b0b0b0]">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* how it works */}
      <section className="border-t border-[#1c1c1c] py-8">
        <h2 className="mb-4 text-lg font-semibold">How it works</h2>
        <ul className="space-y-2 text-sm text-[#b0b0b0]">
          <li>
            • The agent runs <span className="text-white">locally</span> in your
            terminal — it reads, writes, and edits files in your current
            directory.
          </li>
          <li>
            • Model calls are routed through StackAI&apos;s API, which enforces
            your rate limit and keeps the model key server-side.
          </li>
          <li>
            • Free tier includes{" "}
            <span className="text-white">50 requests/day</span> per key.
          </li>
        </ul>
      </section>

      <footer className="border-t border-[#1c1c1c] py-8 text-center font-mono text-xs text-[#5a5a5a]">
        Stack<span className="text-[#e8ff47]">AI</span> · Think it. Type it. Done.
      </footer>
    </main>
  );
}
