import { create } from "zustand";
import { Box, Keypoint, KeypointAnnotation } from "@/classes";

export interface KeypointState {
  keypoints: Keypoint[];
  currentIdx: number;
  baseBox: Box;
  points: KeypointAnnotation[];
}

export type ClickMode = "drag" | "click";
export type ImageType = "fit" | "stretch";
export type InteractionMode = "create" | "edit" | "zoom";

interface ImagePageStore {
  selectedClassId: string | null;
  setSelectedClassId: (id: string) => void;
  clickMode: ClickMode;
  setClickMode: (mode: ClickMode) => void;
  drawingBox: { start: [number, number]; end: [number, number] } | null;
  setDrawingBox: (
    box: { start: [number, number]; end: [number, number] } | null,
  ) => void;
  placingKeypoints: KeypointState | null;
  setPlacingKeypoints: (state: KeypointState | null) => void;
  imageType: ImageType;
  setImageType: (type: ImageType) => void;
  interactionMode: InteractionMode;
  setInteractionMode: (mode: InteractionMode) => void;
}

export const useImagePageStore = create<ImagePageStore>((set) => ({
  selectedClassId: null,
  setSelectedClassId: (id) => set({ selectedClassId: id }),
  clickMode: "drag",
  setClickMode: (mode) => set({ clickMode: mode }),
  drawingBox: null,
  setDrawingBox: (box) => set({ drawingBox: box }),
  placingKeypoints: null,
  setPlacingKeypoints: (state) => set({ placingKeypoints: state }),
  imageType: "fit",
  setImageType: (type) => set({ imageType: type }),
  interactionMode: "create",
  setInteractionMode: (mode) => set({ interactionMode: mode }),
}));
