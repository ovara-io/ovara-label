import React, { useState } from "react";
import { nanoid } from "nanoid";
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
import { ProjectCard } from "@/components/ProjectCard";

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
        {[...projects]
          .sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          )
          .map((project) => (
            <ProjectCard project={project} key={project.id} />
          ))}
      </ul>
    </div>
  );
};
