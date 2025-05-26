import { create } from "zustand/index";

interface KeypointState {
  keypoints: any[];
  currentIdx: number;
  baseBox: [number, number, number, number];
  points: any[];
}

type ClickMode = "drag" | "click-twice";

interface ImagePageStore {
  selectedClassId: string | null;
  setSelectedClassId: (id: string) => void;
  clickMode: ClickMode;
  setClickMode: (mode: ClickMode) => void;
  mousePos: [number, number] | null;
  setMousePos: (pos: [number, number] | null) => void;
  drawingBox: { start: [number, number]; end: [number, number] } | null;
  setDrawingBox: (
    box: { start: [number, number]; end: [number, number] } | null,
  ) => void;
  placingKeypoints: KeypointState | null;
  setPlacingKeypoints: (state: KeypointState | null) => void;
}

export const useImagePageStore = create<ImagePageStore>((set) => ({
  selectedClassId: null,
  setSelectedClassId: (id) => set({ selectedClassId: id }),
  clickMode: "drag",
  setClickMode: (mode) => set({ clickMode: mode }),
  mousePos: null,
  setMousePos: (pos) => set({ mousePos: pos }),
  drawingBox: null,
  setDrawingBox: (box) => set({ drawingBox: box }),
  placingKeypoints: null,
  setPlacingKeypoints: (state) => set({ placingKeypoints: state }),
}));
