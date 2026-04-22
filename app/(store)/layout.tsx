import FurnitureLayout from "@/components/layouts/FurnitureLayout";

type StoreLayoutProps = {
  children: React.ReactNode;
};

export default function StoreLayout({ children }: StoreLayoutProps) {
  return <FurnitureLayout>{children}</FurnitureLayout>;
}
