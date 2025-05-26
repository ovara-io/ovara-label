import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Annotation,
  DetectionClass,
  DetectionProject,
  Keypoint,
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
  deleteImageAnnotationByIndex: (
    projectId: string,
    imagePath: string,
    indexToDelete: number,
  ) => void;
  addImageAnnotation: (
    projectId: string,
    imagePath: string,
    annotation: Annotation,
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

export const useOvaraStore = create<ProjectStore>()(
  persist(
    (set) => {
      const updateProjectState = (
        id: string,
        updater: (project: Project) => Project,
        recordTimeUpdated = true,
      ) =>
        set((state) => {
          const index = state.projects.findIndex((p) => p.id === id);
          if (index === -1) return state;

          const updated = updater({
            ...state.projects[index],
          });

          if (recordTimeUpdated) {
            updated.updatedAt = new Date().toISOString();
          }

          const projects = [...state.projects];
          projects[index] = updated;
          return { projects };
        });

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

        updateProjectImagePaths: (id, paths) =>
          updateProjectState(
            id,
            (project) => ({
              ...project,
              imagePaths: paths,
            }),
            false,
          ),

        updateProjectImageDir: (id, imageDir) =>
          updateProjectState(id, (project) => ({
            ...project,
            imageDir,
          })),

        addImageAnnotation: (projectId, imagePath, annotation) =>
          updateProjectState(projectId, (project) => {
            const existingAnns = project.annotations[imagePath] ?? [];
            return {
              ...project,
              annotations: {
                ...project.annotations,
                [imagePath]: [...existingAnns, annotation],
              },
            };
          }),

        deleteImageAnnotationByIndex: (projectId, imagePath, indexToDelete) =>
          updateProjectState(projectId, (project) => {
            const anns = project.annotations[imagePath] ?? [];
            const updated = anns.filter((_, i) => i !== indexToDelete);
            return {
              ...project,
              annotations: {
                ...project.annotations,
                [imagePath]: updated,
              },
            };
          }),

        addPoseClass: (projectId, newClass) =>
          updateProjectState(projectId, (project) => {
            if (project.modelType !== "pose") return project;
            return {
              ...project,
              classes: [...project.classes, newClass],
            } as PoseProject;
          }),

        deletePoseClass: (projectId, classId) =>
          updateProjectState(projectId, (project) => {
            if (project.modelType !== "pose") return project;
            return {
              ...project,
              classes: project.classes.filter((c) => c.id !== classId),
            } as PoseProject;
          }),

        addPoseKeypoint: (projectId, classId, keypoint) =>
          updateProjectState(projectId, (project) => {
            if (project.modelType !== "pose") return project;
            const updatedClasses = project.classes.map((c) =>
              c.id === classId
                ? { ...c, keypoints: [...c.keypoints, keypoint] }
                : c,
            );
            return {
              ...project,
              classes: updatedClasses,
            } as PoseProject;
          }),

        deletePoseKeypoint: (projectId, classId, keypointId) =>
          updateProjectState(projectId, (project) => {
            if (project.modelType !== "pose") return project;
            const updatedClasses = project.classes.map((c) =>
              c.id === classId
                ? {
                    ...c,
                    keypoints: c.keypoints.filter((kp) => kp.id !== keypointId),
                  }
                : c,
            );
            return {
              ...project,
              classes: updatedClasses,
            } as PoseProject;
          }),

        addDetectionClass: (projectId, newClass) =>
          updateProjectState(projectId, (project) => {
            if (project.modelType !== "detection") return project;
            return {
              ...project,
              classes: [...project.classes, newClass],
            } as DetectionProject;
          }),

        deleteDetectionClass: (projectId, classId) =>
          updateProjectState(projectId, (project) => {
            if (project.modelType !== "detection") return project;
            return {
              ...project,
              classes: project.classes.filter((c) => c.id !== classId),
            } as DetectionProject;
          }),
      };
    },
    {
      name: "ovara-store",
    },
  ),
);
