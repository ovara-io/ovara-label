import React from "react";
import {
  Group,
  Image as KonvaImage,
  Layer,
  Line,
  Rect,
  Stage,
  Text,
  Circle,
} from "react-konva";
import { useOvaraStore } from "@/hooks/useOvaraStore";
import { useImagePageStore } from "@/hooks/useImagePageStore";
import type { PoseAnnotation, PoseClass, Project } from "@/classes";
import { denorm, norm } from "@/lib/image-utils";
import { useShallow } from "zustand/react/shallow";

interface ImageCanvasProps {
  project: Project;
  imagePath: string;
  image: HTMLImageElement | null;
  stageSize: { width: number; height: number };
}

export const ImageCanvas: React.FC<ImageCanvasProps> = ({
  project,
  imagePath,
  image,
  stageSize,
}) => {
  const [addImageAnnotation, deleteImageAnnotationByIndex] = useOvaraStore(
    useShallow((s) => [s.addImageAnnotation, s.deleteImageAnnotationByIndex]),
  );

  const [
    selectedClassId,
    clickMode,
    mousePos,
    setMousePos,
    drawingBox,
    setDrawingBox,
    placingKeypoints,
    setPlacingKeypoints,
  ] = useImagePageStore(
    useShallow((s) => [
      s.selectedClassId,
      s.clickMode,
      s.mousePos,
      s.setMousePos,
      s.drawingBox,
      s.setDrawingBox,
      s.placingKeypoints,
      s.setPlacingKeypoints,
    ]),
  );

  if (!image) return null;

  const handleMouseDown = (e: any) => {
    const pos = e.target.getStage().getPointerPosition();
    if (!pos || e.evt.button !== 0 || e.evt.ctrlKey) return;

    // === Place keypoints
    if (placingKeypoints) {
      const current = placingKeypoints.keypoints[placingKeypoints.currentIdx];
      const updated = [
        ...placingKeypoints.points,
        {
          id: current.id,
          x: norm(pos.x, "x", stageSize),
          y: norm(pos.y, "y", stageSize),
          visible: 2,
        },
      ];

      if (
        placingKeypoints.currentIdx + 1 ===
        placingKeypoints.keypoints.length
      ) {
        addImageAnnotation(project.id, imagePath, {
          classId: selectedClassId!,
          bbox: placingKeypoints.baseBox,
          keypoints: updated,
        });
        setPlacingKeypoints(null);
      } else {
        setPlacingKeypoints({
          ...placingKeypoints,
          currentIdx: placingKeypoints.currentIdx + 1,
          points: updated,
        });
      }
      return;
    }

    // === Draw bounding box
    if (!selectedClassId) return;

    if (clickMode === "drag") {
      setDrawingBox({ start: [pos.x, pos.y], end: [pos.x, pos.y] });
    } else if (clickMode === "click" && selectedClassId) {
      if (!drawingBox) {
        // First click
        setDrawingBox({ start: [pos.x, pos.y], end: [pos.x, pos.y] });
      } else {
        // Second click
        const [x1, y1] = drawingBox.start;
        const [x2, y2] = [pos.x, pos.y];

        const x = Math.min(x1, x2);
        const y = Math.min(y1, y2);
        const width = Math.abs(x2 - x1);
        const height = Math.abs(y2 - y1);

        if (width >= 5 && height >= 5) {
          const bbox: [number, number, number, number] = [
            norm(x, "x", stageSize),
            norm(y, "y", stageSize),
            norm(width, "x", stageSize),
            norm(height, "y", stageSize),
          ];

          if (project.modelType === "pose") {
            const cls = project.classes.find((c) => c.id === selectedClassId)!;
            setPlacingKeypoints({
              keypoints: cls.keypoints,
              currentIdx: 0,
              baseBox: bbox,
              points: [],
            });
          } else {
            addImageAnnotation(project.id, imagePath, {
              classId: selectedClassId,
              bbox,
            });
          }
        }

        setDrawingBox(null);
      }
    }
  };

  const handleMouseMove = (e: any) => {
    const pos = e.target.getStage().getPointerPosition();
    if (pos) {
      setMousePos([pos.x, pos.y]);

      if (clickMode === "drag" && drawingBox) {
        setDrawingBox({ ...drawingBox, end: [pos.x, pos.y] });
      }
    }
  };

  const handleMouseUp = () => {
    if (clickMode !== "drag" || !drawingBox || !selectedClassId) return;

    const [x1, y1] = drawingBox.start;
    const [x2, y2] = drawingBox.end;

    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);

    if (width >= 5 && height >= 5) {
      const bbox: [number, number, number, number] = [
        norm(x, "x", stageSize),
        norm(y, "y", stageSize),
        norm(width, "x", stageSize),
        norm(height, "y", stageSize),
      ];

      if (project.modelType === "pose") {
        const cls = project.classes.find((c) => c.id === selectedClassId)!;
        setPlacingKeypoints({
          keypoints: cls.keypoints,
          currentIdx: 0,
          baseBox: bbox,
          points: [],
        });
      } else {
        addImageAnnotation(project.id, imagePath, {
          classId: selectedClassId,
          bbox,
        });
      }
    }

    setDrawingBox(null);
  };

  const handleContextMenu = (e: any) => {
    e.evt.preventDefault();
    const pos = e.target.getStage().getPointerPosition();
    if (!pos) return;

    // placing keypoint skip
    if (placingKeypoints) {
      const current = placingKeypoints.keypoints[placingKeypoints.currentIdx];
      const updated = [
        ...placingKeypoints.points,
        { id: current.id, x: 0, y: 0, visible: 0 },
      ];

      if (
        placingKeypoints.currentIdx + 1 ===
        placingKeypoints.keypoints.length
      ) {
        addImageAnnotation(project.id, imagePath, {
          classId: selectedClassId!,
          bbox: placingKeypoints.baseBox,
          keypoints: updated,
        });
        setPlacingKeypoints(null);
      } else {
        setPlacingKeypoints({
          ...placingKeypoints,
          currentIdx: placingKeypoints.currentIdx + 1,
          points: updated,
        });
      }
      return;
    }

    const anns = project.annotations[imagePath] ?? [];
    const toDeleteIdx = anns
      .map((ann, i) => ({ ...ann, i }))
      .reverse()
      .find((ann) => {
        const [x, y, w, h] = ann.bbox;
        return (
          pos.x >= denorm(x, "x", stageSize) &&
          pos.x <= denorm(x + w, "x", stageSize) &&
          pos.y >= denorm(y, "y", stageSize) &&
          pos.y <= denorm(y + h, "y", stageSize)
        );
      })?.i;

    if (toDeleteIdx !== undefined) {
      deleteImageAnnotationByIndex(project.id, imagePath, toDeleteIdx);
    }
  };

  return (
    <Stage
      width={stageSize.width}
      height={(image.height / image.width) * stageSize.width}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
      style={{ cursor: "none" }}
    >
      <Layer>
        <KonvaImage
          image={image}
          width={stageSize.width}
          height={(image.height / image.width) * stageSize.width}
        />

        {(project.annotations?.[imagePath] ?? []).map((ann, i) => {
          const [nx, ny, nw, nh] = ann.bbox;
          const x = denorm(nx, "x", stageSize);
          const y = denorm(ny, "y", stageSize);
          const w = denorm(nw, "x", stageSize);
          const h = denorm(nh, "y", stageSize);

          const cls = project.classes.find((c) => c.id === ann.classId);
          return (
            <React.Fragment key={i}>
              <Rect
                x={x}
                y={y}
                width={w}
                height={h}
                stroke="red"
                strokeWidth={2}
              />
              <Text
                x={x}
                y={y - 20}
                text={cls?.name ?? "?"}
                fontSize={14}
                fill="white"
              />
              {project.modelType === "pose" &&
                (ann as PoseAnnotation).keypoints?.map((kp, j) =>
                  kp.visible === 0 ? null : (
                    <React.Fragment key={j}>
                      <Circle
                        x={denorm(kp.x, "x", stageSize)}
                        y={denorm(kp.y, "y", stageSize)}
                        radius={3}
                        fill="cyan"
                        stroke="black"
                        strokeWidth={1}
                      />
                      <Text
                        x={denorm(kp.x, "x", stageSize) + 5}
                        y={denorm(kp.y, "y", stageSize) - 10}
                        text={(cls as PoseClass)?.keypoints[j]?.name ?? kp.id}
                        fontSize={10}
                        fill="white"
                      />
                    </React.Fragment>
                  ),
                )}
            </React.Fragment>
          );
        })}

        {drawingBox?.start && mousePos && (
          <Rect
            x={Math.min(drawingBox.start[0], mousePos[0])}
            y={Math.min(drawingBox.start[1], mousePos[1])}
            width={Math.abs(drawingBox.start[0] - mousePos[0])}
            height={Math.abs(drawingBox.start[1] - mousePos[1])}
            stroke="blue"
            strokeWidth={1}
            dash={[4, 2]}
          />
        )}

        {placingKeypoints && (
          <Group>
            <Rect
              x={denorm(placingKeypoints.baseBox[0], "x", stageSize)}
              y={denorm(placingKeypoints.baseBox[1], "y", stageSize)}
              width={denorm(placingKeypoints.baseBox[2], "x", stageSize)}
              height={denorm(placingKeypoints.baseBox[3], "y", stageSize)}
              stroke="lime"
              strokeWidth={2}
              dash={[4, 4]}
            />
            {placingKeypoints.points.map((kp, i) =>
              kp.visible !== 0 ? (
                <Circle
                  key={i}
                  x={denorm(kp.x, "x", stageSize)}
                  y={denorm(kp.y, "y", stageSize)}
                  radius={3}
                  fill="lime"
                  stroke="black"
                  strokeWidth={1}
                />
              ) : null,
            )}
          </Group>
        )}

        {mousePos && (
          <>
            <Line
              points={[0, mousePos[1], stageSize.width, mousePos[1]]}
              stroke="white"
              dash={[4, 4]}
              opacity={0.75}
            />
            <Line
              points={[mousePos[0], 0, mousePos[0], stageSize.height]}
              stroke="white"
              dash={[4, 4]}
              opacity={0.75}
            />
            {placingKeypoints && (
              <Text
                x={mousePos[0] + 7.5}
                y={mousePos[1] - 20}
                text={`Place: ${
                  placingKeypoints.keypoints[placingKeypoints.currentIdx].name
                }`}
                fontSize={16}
                fill="yellow"
              />
            )}
          </>
        )}
      </Layer>
    </Stage>
  );
};
