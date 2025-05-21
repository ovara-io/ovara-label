import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Project } from "../classes";

interface ProjectStore {
  projects: Project[];
  addProject: (project: Project) => void;
}

export const useOvaraStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      addProject: (project) =>
        set((state) => ({
          projects: [...state.projects, project],
        })),
    }),
    {
      name: "ovara-store",
    },
  ),
);
