import AdminLayout from "@/components/layouts/AdminLayout";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <AdminLayout>{children}</AdminLayout>;
}
