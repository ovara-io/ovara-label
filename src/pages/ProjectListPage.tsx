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

const ProjectCard = ({ project }: { project: Project }) => {
  const [, navigate] = useLocation();

  const handleSelect = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  return (
    <li
      className="cursor-pointer rounded border p-4"
      onClick={() => handleSelect(project.id)}
    >
      <div className="text-lg font-semibold">{project.name}</div>
      <div className="text-muted-foreground text-sm">
        Type: {project.modelType} | Images: {project.numImages ?? 0} | Labelled:{" "}
        {project.numLabelled ?? 0}
      </div>
      <div className="text-muted-foreground text-xs">
        Created: {new Date(project.createdAt).toLocaleString()}
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
      numImages: 0,
      numLabelled: 0,
    };
    addProject(newProject);
    setName("");
  };

  return (
    <div>
      <div>
        <h1 className="py-2 text-lg font-bold">Create New Project</h1>
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
      <h1 className={"py-2 text-lg font-bold"}>Select a Project</h1>

      <ul className="space-y-2">
        {projects.map((project) => (
          <ProjectCard project={project} key={project.id} />
        ))}
      </ul>
    </div>
  );
};
