import { useParams } from "wouter";
import { useOvaraStore } from "../hooks/useOvaraStore";
import { useShallow } from "zustand/react/shallow";

export const ProjectPage = () => {
  const { id } = useParams<{ id: string }>();
  const [projects] = useOvaraStore(useShallow((state) => [state.projects]));
  const project = projects.find((p) => p.id === id);

  if (!project)
    return <div className="p-4 text-red-500">Project not found.</div>;

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">{project.name}</h1>
      <p>Model type: {project.modelType}</p>
    </div>
  );
};
