import NextAuth from "next-auth";
import Twitter from "next-auth/providers/twitter";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * NextAuth v5 config. Sign in with X (Twitter OAuth 2.0). On sign-in we upsert
 * the user into Supabase and stash our internal users.id on the JWT so the
 * dashboard can scope queries to that user.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    Twitter({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const data = (profile as { data?: TwitterProfile })?.data;
      if (!data?.id) return false;

      await supabaseAdmin.from("users").upsert(
        {
          x_id: data.id,
          x_username: data.username ?? data.id,
          x_name: data.name ?? null,
          avatar_url: data.profile_image_url ?? null,
        },
        { onConflict: "x_id" },
      );
      return true;
    },
    async jwt({ token, profile }) {
      const data = (profile as { data?: TwitterProfile })?.data;
      if (data?.id) {
        token.username = data.username;
        if (data.profile_image_url) token.picture = data.profile_image_url;
        const { data: row } = await supabaseAdmin
          .from("users")
          .select("id, tier")
          .eq("x_id", data.id)
          .maybeSingle();
        if (row) {
          token.userId = row.id as string;
          token.tier = row.tier as string;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
        session.user.tier = (token.tier as string) ?? "free";
        session.user.username = token.username as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

interface TwitterProfile {
  id: string;
  username?: string;
  name?: string;
  profile_image_url?: string;
}
