import axios from "axios";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { login } from "@/data/api/auth";
import { API_BASE, API_URLS } from "@/data/utils/api.urls";
import { mockAuthorizeCredentials } from "@/lib/mock-auth-login";
import { resolveAuthSecret } from "@/lib/auth-secret";
import { CredentialsType, LoggedInUser } from "@/data/types/auth";

export const refreshAccessToken = async (token: JWT) => {
  try {
    const refreshToken = (token as any).refresh_token;
    const refreshTokenUrl = `${API_URLS.auth}/refresh`;
    const response = await axios.post(refreshTokenUrl, null, {
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    });
    return {
      ...response.data,
    };
  } catch (_error) {
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
};

export const authOptions: NextAuthOptions = {
  secret: resolveAuthSecret(),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {},
      authorize: async (credentials) => {
        try {
          const { email, password } = credentials as CredentialsType;
          if (!API_BASE) {
            const mock = mockAuthorizeCredentials(email, password);
            return mock ? (mock as unknown as LoggedInUser) : null;
          }
          const response = await login({ email, password });
          if (response.data) return response.data;
          return null;
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
        const loggedInUser = user as LoggedInUser;
        token.expires_at = loggedInUser.expires_at;
        token.access_token = loggedInUser.access_token;
        token.refresh_token = loggedInUser.refresh_token;
        token.role = loggedInUser.user.role;
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
        if (!API_BASE) {
          return { ...token, expires_at: Date.now() + 1000 * 60 * 60 * 24 };
        }
        return await refreshAccessToken(token);
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
