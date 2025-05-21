import React, { useState } from "react";
import { nanoid } from "nanoid";
import { useLocation } from "wouter";
import { ModelType, Project } from "../classes";
import { useOvaraStore } from "../hooks/useOvaraStore";
import { useShallow } from "zustand/react/shallow";

export const ProjectListPage = () => {
  const [projects, addProject] = useOvaraStore(
    useShallow((state) => [state.projects, state.addProject]),
  );

  const [name, setName] = useState("");
  const [modelType, setModelType] = useState<ModelType>("detection");
  const [, navigate] = useLocation();

  const handleCreate = () => {
    const newProject: Project = {
      id: nanoid(),
      name,
      imageDir: "",
      modelType,
      classes: [],
    };
    addProject(newProject);
    setName("");
  };

  const handleSelect = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-xl font-bold">Select a Project</h1>

      <ul className="space-y-2">
        {projects.map((project) => (
          <li key={project.id}>
            <button
              className="rounded bg-gray-200 p-2 hover:bg-blue-100"
              onClick={() => handleSelect(project.id)}
            >
              {project.name} ({project.modelType})
            </button>
          </li>
        ))}
      </ul>

      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold">Create New Project</h2>
        <input
          className="mr-2 border p-2"
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          className="mr-2 border p-2"
          value={modelType}
          onChange={(e) => setModelType(e.target.value as ModelType)}
        >
          <option value="detection">Detection</option>
          <option value="pose">Pose</option>
        </select>
        <button
          className="rounded bg-green-500 p-2 text-white"
          onClick={handleCreate}
        >
          Create
        </button>
      </div>
    </div>
  );
};
