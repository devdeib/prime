"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import ProfileBasicInfo from "@/components/dashboard/user/ProfileBasicInfo";
import Loader from "@/components/common/loader/Loader";
import { getUser } from "@/data/api/user";
import { User } from "@/data/model/user";
import { Alert } from "react-bootstrap";

type SessionUser = { id?: number | string };
type SessionWithToken = { access_token?: string; user?: SessionUser };

function userFromSession(session: SessionWithToken): User | null {
  const u = session.user as User | undefined;
  if (u && typeof u.id === "number") return u;
  return null;
}

export default function DashboardProfilePage() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !session) return;

    const load = async () => {
      setError(null);
      const typedSession = session as SessionWithToken;
      const token = `${typedSession.access_token ?? ""}`;
      const userId = Number(typedSession.user?.id ?? 0);
      if (!userId) {
        setError("Session has no user id.");
        setUser(userFromSession(typedSession));
        return;
      }
      try {
        const res = await getUser(userId, token);
        const payload = res.data as { data?: User };
        const row = payload.data ?? (res.data as unknown as User);
        setUser(row);
      } catch {
        const fallback = userFromSession(typedSession);
        if (fallback) {
          setUser(fallback);
          setError(
            "Could not refresh profile from the server; showing session data."
          );
        } else {
          setError("Could not load profile. Check API / sign in again.");
        }
      }
    };

    load();
  }, [session, status]);

  if (status === "loading") return <Loader />;

  if (status === "unauthenticated") {
    return (
      <Alert variant="warning" className="m-4">
        Please sign in to view your profile.
      </Alert>
    );
  }

  if (!user) {
    return (
      <div className="p-4">
        {error && <Alert variant="danger">{error}</Alert>}
        {!error && <Loader />}
      </div>
    );
  }

  return (
    <div>
      {error && (
        <Alert variant="info" className="m-3 mb-0" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <ProfileBasicInfo user={user} />
    </div>
  );
}
