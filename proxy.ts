import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { resolveAuthSecret } from "@/lib/auth-secret";

export default withAuth(
  function proxy() {
    return NextResponse.next();
  },
  {
    secret: resolveAuthSecret(),
    callbacks: {
      authorized({ token }) {
        return token?.role === "admin" || token?.role === "user";
      },
    },
  }
);

export const config = { matcher: ["/dashboard/:path*"] };
