import ShowroomDetailView from "@/components/showrooms/ShowroomDetailView";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ShowroomDetailPage({ params }: PageProps) {
  const { id } = await params;
  const showroomId = Number(id);

  if (!Number.isFinite(showroomId) || showroomId <= 0) {
    return <ShowroomDetailView showroomId={-1} />;
  }

  return <ShowroomDetailView showroomId={showroomId} />;
}
