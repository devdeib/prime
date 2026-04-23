import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { resolveAuthSecret } from "@/lib/auth-secret";
import { CredentialsType } from "@/data/types/auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const authOptions: NextAuthOptions = {
  secret: resolveAuthSecret(),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {},
      authorize: async (credentials) => {
        try {
          const { email, password } = credentials as CredentialsType;

          const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .eq("password", password)
            .single();

          if (error || !user) return null;

          return {
            id: String(user.id),
            name: `${user.first_name} ${user.last_name}`,
            email: user.email,
            role: user.role,
            user: {
              id: String(user.id),
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              role: user.role,
              phone: user.phone,
            },
            access_token: `mock-${user.id}`,
            refresh_token: `mock-refresh-${user.id}`,
            expires_at: Date.now() + 1000 * 60 * 60 * 24 * 365,
          };
        } catch (_error) {
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 29,
  },
  jwt: {
    maxAge: 60 * 29,
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        const loggedInUser = user as any;
        token.expires_at = loggedInUser.expires_at;
        token.access_token = loggedInUser.access_token;
        token.refresh_token = loggedInUser.refresh_token;
        token.role = loggedInUser.role;
        token.user = loggedInUser.user;
        return token;
      }
      const expAt = (token as { expires_at?: number }).expires_at;
      if (expAt != null && expAt < Date.now()) {
        const rt = String((token as { refresh_token?: string }).refresh_token ?? "");
        if (rt.startsWith("mock-")) {
          return {
            ...token,
            expires_at: Date.now() + 1000 * 60 * 60 * 24 * 365,
          };
        }
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (!token) return session;
      const { iat, exp, jti, ...allTokens } = token as Record<string, unknown>;
      void iat;
      void exp;
      void jti;
      return { ...session, ...allTokens };
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};