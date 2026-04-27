"use client";

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import UserList from "@/components/dashboard/user/UserList";
import Loader from "@/components/common/loader/Loader";
import { getUsers } from "@/data/api/user";
import { User } from "@/data/model/user";
import { useTranslation } from "react-i18next";

type SessionUser = { id?: number | string };
type SessionWithToken = { access_token?: string; role?: string; user?: SessionUser };

export default function DashboardUsersPage() {
  const { t } = useTranslation("common");
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    let mounted = true;
    const load = async () => {
      if (!session) return;
      const typedSession = session as SessionWithToken;
      const token = `${typedSession.access_token ?? ""}`;
      const role = `${typedSession.role ?? ""}`;
      if (role !== "admin") {
        if (mounted) setUsers([]);
        return;
      }
      try {
        setError(null);
        const usersResults = await getUsers(token);
        if (mounted) setUsers(Array.isArray(usersResults.data) ? usersResults.data : []);
      } catch {
        if (mounted) {
          setError(t("dashboard.failedToLoadUsers"));
          setUsers([]);
        }
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [session, status, t]);

  if (status === "loading" || (status === "authenticated" && users === null)) {
    return <Loader />;
  }
  if (status === "unauthenticated") {
    return <div className="p-4 text-warning">{t("dashboard.pleaseSignInAgain")}</div>;
  }

  if (error) return <div className="p-4 text-danger">{error}</div>;

  return <UserList users={users ?? []} />;
}
