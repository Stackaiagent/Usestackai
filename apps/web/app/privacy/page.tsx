import Link from "next/link";

export const metadata = {
  title: "Privacy Policy",
  description: "How StackAI collects, uses, and protects your data.",
};

const UPDATED = "June 7, 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-2 text-lg font-semibold text-white">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed text-[#aaa]">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-14">
      <Link
        href="/"
        className="font-mono text-xs uppercase tracking-wider text-[#888] hover:text-white"
      >
        ← Stack<span className="text-[#e8ff47]">AI</span>
      </Link>

      <h1 className="mt-8 text-3xl font-bold text-white">Privacy Policy</h1>
      <p className="mt-2 text-sm text-[#666]">Last updated: {UPDATED}</p>

      <Section title="Overview">
        <p>
          StackAI (&ldquo;we&rdquo;, &ldquo;us&rdquo;) provides an AI coding
          agent available through a CLI, a web app, and an editor extension.
          This policy explains what we collect and why. We collect the minimum
          needed to run the service.
        </p>
      </Section>

      <Section title="What we collect">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-white">Account info.</strong> When you sign
            in with X (Twitter), we receive your public profile: account ID,
            username, display name, and avatar URL.
          </li>
          <li>
            <strong className="text-white">API keys.</strong> We store only a
            SHA-256 <em>hash</em> of each key plus a short prefix for display.
            The raw key is shown once at creation and never stored.
          </li>
          <li>
            <strong className="text-white">Usage data.</strong> We count
            requests per key per day to enforce rate limits.
          </li>
          <li>
            <strong className="text-white">Prompts &amp; code.</strong> Content
            you send to the agent (your prompt and the file context needed for a
            request) is transmitted to our AI provider to generate a response.
            Vibe projects you create are stored in your browser; saved sessions
            may be stored on our servers if you opt to save them.
          </li>
        </ul>
      </Section>

      <Section title="How we use it">
        <p>
          To authenticate you, enforce rate limits, generate agent responses,
          and operate and improve the service. We do not sell your personal
          data.
        </p>
      </Section>

      <Section title="Service providers">
        <p>
          We share data only as needed with infrastructure providers that
          process it on our behalf: the AI model provider (Xiaomi MiMo) to
          generate responses, Supabase (database &amp; auth), Upstash (rate
          limiting), and our hosting providers (Vercel, Railway). Each processes
          data only to provide their service.
        </p>
      </Section>

      <Section title="Local processing">
        <p>
          The CLI runs the agent on your machine and only acts on files inside
          the directory you run it in. File contents are sent to the AI provider
          only as part of a request you initiate.
        </p>
      </Section>

      <Section title="Data retention &amp; your choices">
        <p>
          You can revoke an API key at any time from your dashboard, which stops
          all access tied to that key. To delete your account and associated
          data, contact us. Cached prompts and rate-limit counters expire
          automatically.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about privacy? Reach us at{" "}
          <a
            href="mailto:hello@usestackai.com"
            className="text-[#e8ff47] underline"
          >
            hello@usestackai.com
          </a>{" "}
          or{" "}
          <a
            href="https://x.com/askstackai"
            className="text-[#e8ff47] underline"
          >
            @askstackai
          </a>
          .
        </p>
      </Section>
    </main>
  );
}
