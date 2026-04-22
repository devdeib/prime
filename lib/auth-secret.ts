/**
 * Shared secret for NextAuth (API route + middleware must match).
 * Middleware does not read `authOptions.secret` unless passed via `withAuth({ secret })`
 * or `NEXTAUTH_SECRET` in the environment.
 */
export function resolveAuthSecret(): string {
  const fromEnv = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[next-auth] NEXTAUTH_SECRET is not set — using an insecure built-in fallback. Set NEXTAUTH_SECRET in production."
    );
  }
  return "vg-app-dev-only-nextauth-secret-not-for-production";
}
