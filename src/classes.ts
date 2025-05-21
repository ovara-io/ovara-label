export enum Visible {
    NotLabeled = 0,
    LabeledNotVisible = 1,
    LabeledVisible = 2,
}

// Discriminated union for model type
export type ModelType = 'detection' | 'pose';

export type Project = DetectionProject | PoseProject;

interface BaseProject {
    id: string;
    name: string;
    imageDir: string;
    labelDir?: string;
}

export interface DetectionProject extends BaseProject {
    modelType: 'detection';
    classes: DetectionClass[];
}

export interface PoseProject extends BaseProject {
    modelType: 'pose';
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
    keypoints: string[];
}

export type Annotation = DetectionAnnotation | PoseAnnotation;

export interface DetectionAnnotation {
    classId: string;
    bbox: [x: number, y: number, width: number, height: number];
}

export interface PoseAnnotation extends DetectionAnnotation {
    keypoints: Keypoint[];
}

export interface Keypoint {
    name: string;
    x: number;
    y: number;
    visible: Visible;
}

export interface ImageAnnotation {
    imageFilename: string;
    annotations: Annotation[];
}
