// We use discriminated unions based on ModelType
export type ModelType = "detection" | "pose";

export type Project = DetectionProject | PoseProject;

interface BaseProject {
  id: string;
  name: string;
  imageDir: string;
  updatedAt?: string;
  createdAt: string;
  imagePaths: string[];
}

export interface DetectionProject extends BaseProject {
  modelType: "detection";
  classes: DetectionClass[];
  annotations: Record<string, DetectionAnnotation[]>;
}

export interface PoseProject extends BaseProject {
  modelType: "pose";
  classes: PoseClass[];
  annotations: Record<string, PoseAnnotation[]>;
}

export interface DetectionClass {
  id: string;
  name: string;
}

export interface PoseClass extends DetectionClass {
  keypoints: Keypoint[];
}
export interface Keypoint {
  id: string;
  name: string;
}

export interface DetectionAnnotation {
  classId: string;
  color: string;
  bbox: Box;
}

export interface PoseAnnotation extends DetectionAnnotation {
  keypoints: KeypointAnnotation[];
}

export type Annotation = DetectionAnnotation | PoseAnnotation;

export enum Visibility {
  NotLabeled = 0,
  LabeledNotVisible = 1,
  LabeledVisible = 2,
}

export interface KeypointAnnotation {
  id: string;
  x: number;
  y: number;
  visible: Visibility;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}
