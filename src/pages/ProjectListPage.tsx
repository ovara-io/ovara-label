import React, { useState } from "react";
import { nanoid } from "nanoid";
import { useLocation } from "wouter";
import { ModelType, Project } from "@/classes";
import { useOvaraStore } from "@/hooks/useOvaraStore";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const ProjectCard = ({ project }: { project: Project }) => {
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
          Type: {project.modelType} | Images: {project.imagePaths.length ?? 0} |
          Labelled: {numLabelled ?? 0}
        </div>
      </div>
      <div className="text-muted-foreground space-y-1 text-right">
        <div>Created: {new Date(project.createdAt).toLocaleString()}</div>
        <div>Updated: {new Date(project.updatedAt).toLocaleString()}</div>
      </div>
    </li>
  );
};

export const ProjectListPage = () => {
  const [projects, addProject] = useOvaraStore(
    useShallow((state) => [state.projects, state.addProject]),
  );

  const [name, setName] = useState("");
  const [modelType, setModelType] = useState<ModelType>("detection");

  const handleCreate = () => {
    const now = new Date().toISOString();
    const newProject: Project = {
      id: nanoid(),
      name,
      imageDir: "",
      modelType,
      classes: [],
      createdAt: now,
      updatedAt: now,
      imagePaths: [],
      annotations: {},
    };
    addProject(newProject);
    setName("");
  };

  return (
    <div className={"space-y-6 p-4"}>
      <div>
        <h1 className="pb-2 text-2xl font-bold">Create New Project</h1>
        <div className={"flex gap-2"}>
          <Input
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Select
            value={modelType}
            onValueChange={(value: ModelType) => setModelType(value)}
          >
            <SelectTrigger className="min-w-[120px]">
              <SelectValue placeholder="Select model type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="detection">Detection</SelectItem>
              <SelectItem value="pose">Pose</SelectItem>
            </SelectContent>
          </Select>
          <Button className="rounded" onClick={handleCreate}>
            Create
          </Button>
        </div>
      </div>
      <Separator />

      <h1 className={"text-2xl font-bold"}>Select a Project</h1>

      <ul className="space-y-2">
        {projects.map((project) => (
          <ProjectCard project={project} key={project.id} />
        ))}
      </ul>
    </div>
  );
};
