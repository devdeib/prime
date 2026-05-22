import ProjectDetailView from "@/components/projects/ProjectDetailView";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const projectId = Number(id);

  if (!Number.isFinite(projectId) || projectId <= 0) {
    return <ProjectDetailView projectId={-1} />;
  }

  return <ProjectDetailView projectId={projectId} />;
}
