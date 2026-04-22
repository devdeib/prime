"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Alert } from "react-bootstrap";
import Loader from "@/components/common/loader/Loader";
import EditUserInfo from "@/components/dashboard/user/EditUserInfo";
import { getUser } from "@/data/api/user";
import { User } from "@/data/model/user";

type SessionWithToken = { access_token?: string };

type DashboardUserEditClientProps = {
  userId: string;
};

export default function DashboardUserEditClient({
  userId,
}: DashboardUserEditClientProps) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    let mounted = true;
    const load = async () => {
      if (!session) return;
      const token = `${(session as SessionWithToken).access_token ?? ""}`;
      try {
        setError(null);
        const userResults = await getUser(Number(userId), token);
        if (mounted) setUser(userResults.data.data);
      } catch {
        if (mounted) setError("Could not load user.");
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [session, status, userId]);

  if (status === "loading") return <Loader />;
  if (status === "unauthenticated") {
    return <Alert variant="warning" className="m-4">Please sign in again.</Alert>;
  }

  if (error) return <Alert variant="warning" className="m-4">{error}</Alert>;
  if (!user) return <Loader />;

  return <EditUserInfo user={user} />;
}
