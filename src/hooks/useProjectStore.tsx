import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DetectionAnnotation,
  DetectionClass,
  DetectionProject,
  Keypoint,
  PoseAnnotation,
  PoseClass,
  PoseProject,
  Project,
} from "@/classes";

interface ProjectStore {
  projects: Project[];
  addProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  updateProjectImagePaths: (id: string, paths: string[]) => void;
  updateProjectImageDir: (id: string, imageDir: string) => void;
  addImageAnnotation: (
    projectId: string,
    imagePath: string,
    annotation: DetectionAnnotation | PoseAnnotation,
  ) => void;

  deleteImageAnnotationByIndex: (
    projectId: string,
    imagePath: string,
    indexToDelete: number,
  ) => void;
  addPoseClass: (projectId: string, newClass: PoseClass) => void;
  deletePoseClass: (projectId: string, classId: string) => void;
  addPoseKeypoint: (
    projectId: string,
    classId: string,
    keypoint: Keypoint,
  ) => void;
  deletePoseKeypoint: (
    projectId: string,
    classId: string,
    keypointId: string,
  ) => void;
  addDetectionClass: (projectId: string, newClass: DetectionClass) => void;
  deleteDetectionClass: (projectId: string, classId: string) => void;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => {
      function updateProjectState<T extends Project>(
        id: string,
        updater: (project: T) => T,
        recordTimeUpdated = true,
      ) {
        set((state) => {
          const index = state.projects.findIndex((p) => p.id === id);
          if (index === -1) return state;

          const original = state.projects[index] as T;
          const updated = updater(original);

          if (recordTimeUpdated) {
            updated.updatedAt = new Date().toISOString();
          }

          const projects = [...state.projects];
          projects[index] = updated;
          return { projects };
        });
      }

      return {
        projects: [],

        addProject: (project) =>
          set((state) => ({
            projects: [...state.projects, project],
          })),

        deleteProject: (id) =>
          set((state) => ({
            projects: state.projects.filter((p) => p.id !== id),
          })),

        updateProjectImagePaths: (id, paths) => {
          const fn = (project: Project) => ({
            ...project,
            imagePaths: paths,
          });
          updateProjectState(id, fn, false);
        },

        updateProjectImageDir: (id, imageDir) => {
          const fn = (project: Project) => ({
            ...project,
            imageDir,
          });
          updateProjectState(id, fn);
        },

        addImageAnnotation: (projectId, imagePath, annotation) =>
          set((state) => {
            const index = state.projects.findIndex((p) => p.id === projectId);
            if (index === -1) return state;

            const projects = [...state.projects];

            const project = projects[index];
            const annotations = project.annotations[imagePath] ?? [];

            projects[index] = {
              ...project,
              annotations: {
                ...project.annotations,
                [imagePath]: [...annotations, annotation],
              },
              updatedAt: new Date().toISOString(),
            } as Project;

            return { projects };
          }),

        deleteImageAnnotationByIndex: (projectId, imagePath, indexToDelete) =>
          set((state) => {
            const index = state.projects.findIndex((p) => p.id === projectId);
            if (index === -1) return state;

            const projects = [...state.projects];

            const project = projects[index];
            const anns = project.annotations[imagePath];
            const updatedAnns = anns.filter((_, i) => i !== indexToDelete);

            projects[index] = {
              ...project,
              annotations: {
                ...project.annotations,
                [imagePath]: updatedAnns,
              },
              updatedAt: new Date().toISOString(),
            } as Project;

            return { projects };
          }),

        addPoseClass: (projectId, newClass) => {
          const fn = (project: PoseProject) => ({
            ...project,
            classes: [...project.classes, newClass],
          });
          updateProjectState(projectId, fn);
        },

        deletePoseClass: (projectId, classId) => {
          const fn = (project: PoseProject) => ({
            ...project,
            classes: project.classes.filter((c) => c.id !== classId),
          });
          updateProjectState(projectId, fn);
        },

        addPoseKeypoint: (projectId, classId, keypoint) => {
          const fn = (project: PoseProject) => ({
            ...project,
            classes: project.classes.map((c) =>
              c.id === classId
                ? { ...c, keypoints: [...c.keypoints, keypoint] }
                : c,
            ),
          });
          updateProjectState(projectId, fn);
        },

        deletePoseKeypoint: (projectId, classId, keypointId) => {
          const fn = (project: PoseProject) => ({
            ...project,
            classes: project.classes.map((c) =>
              c.id === classId
                ? {
                    ...c,
                    keypoints: c.keypoints.filter((kp) => kp.id !== keypointId),
                  }
                : c,
            ),
          });
          updateProjectState(projectId, fn);
        },

        addDetectionClass: (projectId, newClass) => {
          const fn = (project: DetectionProject) => ({
            ...project,
            classes: [...project.classes, newClass],
          });
          updateProjectState(projectId, fn);
        },

        deleteDetectionClass: (projectId, classId) => {
          const fn = (project: DetectionProject) => ({
            ...project,
            classes: project.classes.filter((c) => c.id !== classId),
          });
          updateProjectState(projectId, fn);
        },
      };
    },
    {
      name: "ovara-store",
    },
  ),
);
