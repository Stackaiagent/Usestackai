import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6">
      <div className="text-center">
        <h1 className="font-mono text-sm uppercase tracking-widest text-[#888]">
          StackAI
        </h1>
        <p className="mt-4 text-3xl font-bold">Think it. Type it. Done.</p>
        <p className="mt-2 text-[#888]">Sign in to get your API key.</p>
      </div>

      <form
        action={async () => {
          "use server";
          await signIn("twitter", { redirectTo: "/dashboard" });
        }}
      >
        <button
          type="submit"
          className="bg-[#e8ff47] px-7 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-black transition-opacity hover:opacity-90"
        >
          Sign in with X
        </button>
      </form>
    </main>
  );
}
