import DashboardUserEditClient from "./DashboardUserEditClient";
import { loadStore } from "@/lib/mock-backend-store";

export function generateStaticParams() {
  const store = loadStore();

  return store.users.map((user) => ({
    id: String(user.id),
  }));
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function DashboardUserEditPage(props: Props) {
  const { id } = await props.params;

  return <DashboardUserEditClient userId={id} />;
}
