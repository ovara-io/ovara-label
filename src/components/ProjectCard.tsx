import { Project } from "@/classes";
import { useLocation } from "wouter";
import React from "react";

export const ProjectCard = ({ project }: { project: Project }) => {
  const [, navigate] = useLocation();

  const handleSelect = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  const numLabelled = Object.values(project.annotations).filter(
    (a) => a.length > 0,
  ).length;

  return (
    <li
      className="hover:bg-muted flex cursor-pointer items-center justify-between rounded border p-4 transition"
      onClick={() => handleSelect(project.id)}
    >
      <div>
        <div className="truncate text-xl font-semibold">{project.name}</div>
        <div className="text-muted-foreground truncate">
          Images: {project.imagePaths.length ?? 0}{" "}
          {project.imagePaths.length > 0 && (
            <span className={"font-semibold"}>
              | {(numLabelled / project.imagePaths.length) * 100}% Labelled
            </span>
          )}
        </div>
      </div>
      <div className="space-y-1 text-right">
        <div>Type: {project.modelType}</div>
        <div>Updated: {new Date(project.updatedAt).toLocaleString()}</div>
      </div>
    </li>
  );
};
