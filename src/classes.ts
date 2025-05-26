export enum Visible {
  NotLabeled = 0,
  LabeledNotVisible = 1,
  LabeledVisible = 2,
}

// Discriminated union for model type
export type ModelType = "detection" | "pose";

export type Project = DetectionProject | PoseProject;

type AnnotationsByImage = {
  [imagePath: string]: Annotation[];
};

interface BaseProject {
  id: string;
  name: string;
  imageDir: string;
  updatedAt?: string;
  createdAt: string;
  imagePaths: string[];
  annotations: AnnotationsByImage;
}

export interface DetectionProject extends BaseProject {
  modelType: "detection";
  classes: DetectionClass[];
}

export interface PoseProject extends BaseProject {
  modelType: "pose";
  classes: PoseClass[];
}

export interface DetectionClass {
  id: string;
  name: string;
  color?: string;
}

export interface PoseClass {
  id: string;
  name: string;
  color?: string;
  keypoints: Keypoint[];
}
export interface Keypoint {
  id: string;
  name: string;
}

export type Annotation = DetectionAnnotation | PoseAnnotation;

export interface DetectionAnnotation {
  classId: string;
  bbox: [x: number, y: number, width: number, height: number];
}

export interface PoseAnnotation extends DetectionAnnotation {
  keypoints: KeypointAnnotation[];
}

export interface KeypointAnnotation {
  id: string;
  x: number;
  y: number;
  visible: Visible;
}
