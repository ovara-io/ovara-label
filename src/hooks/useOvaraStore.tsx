import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Project } from "@/classes";

interface ProjectStore {
  projects: Project[];
  addProject: (project: Project) => void;
  updateProject: (id: string, partial: Partial<Project>) => void;
  updateImagePaths: (id: string, paths: string[]) => void;
}

export const useOvaraStore = create<ProjectStore>()(
  persist(
    (set) => ({
      projects: [],
      addProject: (project) =>
        set((state) => ({
          projects: [...state.projects, project],
        })),
      updateImagePaths: (id: string, paths: string[]) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, imagePaths: paths } : p,
          ),
        })),
      updateProject: (id, partial) =>
        set((state) => {
          const index = state.projects.findIndex((p) => p.id === id);
          const existing = state.projects[index];

          const updated = {
            ...existing,
            ...partial,
            updatedAt: new Date().toISOString(),
          } as Project;

          const newProjects = [...state.projects];
          newProjects[index] = updated;

          return { projects: newProjects };
        }),
    }),
    {
      name: "ovara-store",
    },
  ),
);
