import React from "react";
import {
  Circle,
  Group,
  Image as KonvaImage,
  Layer,
  Line,
  Rect,
  Stage,
  Text,
} from "react-konva";
import { useOvaraStore } from "@/hooks/useOvaraStore";
import { useImagePageStore } from "@/hooks/useImagePageStore";
import {
  KeypointVisibility,
  PoseAnnotation,
  PoseClass,
  Project,
} from "@/classes";
import { denorm, norm } from "@/lib/image-utils";
import Konva from "konva";

interface ImageCanvasProps {
  project: Project;
  imagePath: string;
  image: HTMLImageElement | null;
  renderSize: { width: number; height: number };
}

export const ImageCanvas: React.FC<ImageCanvasProps> = ({
  project,
  imagePath,
  image,
  renderSize,
}) => {
  const addImageAnnotation = useOvaraStore((s) => s.addImageAnnotation);
  const deleteImageAnnotationByIndex = useOvaraStore(
    (s) => s.deleteImageAnnotationByIndex,
  );

  const selectedClassId = useImagePageStore((s) => s.selectedClassId);
  const clickMode = useImagePageStore((s) => s.clickMode);
  const mousePos = useImagePageStore((s) => s.mousePos);
  const setMousePos = useImagePageStore((s) => s.setMousePos);
  const drawingBox = useImagePageStore((s) => s.drawingBox);
  const setDrawingBox = useImagePageStore((s) => s.setDrawingBox);
  const placingKeypoints = useImagePageStore((s) => s.placingKeypoints);
  const setPlacingKeypoints = useImagePageStore((s) => s.setPlacingKeypoints);

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = e.target.getStage().getPointerPosition();
    if (!pos || e.evt.button !== 0 || e.evt.ctrlKey) return;

    if (placingKeypoints) {
      const current = placingKeypoints.keypoints[placingKeypoints.currentIdx];
      const updated = [
        ...placingKeypoints.points,
        {
          id: current.id,
          x: norm(pos.x, "x", renderSize),
          y: norm(pos.y, "y", renderSize),
          visible: KeypointVisibility.LabeledVisible,
        },
      ];

      if (
        placingKeypoints.currentIdx + 1 ===
        placingKeypoints.keypoints.length
      ) {
        addImageAnnotation(project.id, imagePath, {
          classId: selectedClassId,
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
            norm(x, "x", renderSize),
            norm(y, "y", renderSize),
            norm(width, "x", renderSize),
            norm(height, "y", renderSize),
          ];

          if (project.modelType === "pose") {
            const cls = project.classes.find((c) => c.id === selectedClassId);
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

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
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
        norm(x, "x", renderSize),
        norm(y, "y", renderSize),
        norm(width, "x", renderSize),
        norm(height, "y", renderSize),
      ];

      if (project.modelType === "pose") {
        const cls = project.classes.find((c) => c.id === selectedClassId);
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

  const handleContextMenu = (e: Konva.KonvaEventObject<MouseEvent>) => {
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
          classId: selectedClassId,
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
          pos.x >= denorm(x, "x", renderSize) &&
          pos.x <= denorm(x + w, "x", renderSize) &&
          pos.y >= denorm(y, "y", renderSize) &&
          pos.y <= denorm(y + h, "y", renderSize)
        );
      })?.i;

    if (toDeleteIdx !== undefined) {
      deleteImageAnnotationByIndex(project.id, imagePath, toDeleteIdx);
    }
  };

  return (
    <Stage
      width={renderSize.width}
      height={(image.height / image.width) * renderSize.width}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
      style={{ cursor: "none" }}
    >
      <Layer>
        <KonvaImage
          image={image}
          width={renderSize.width}
          height={(image.height / image.width) * renderSize.width}
        />

        {(project.annotations?.[imagePath] ?? []).map((ann, i) => {
          const [nx, ny, nw, nh] = ann.bbox;
          const x = denorm(nx, "x", renderSize);
          const y = denorm(ny, "y", renderSize);
          const w = denorm(nw, "x", renderSize);
          const h = denorm(nh, "y", renderSize);

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
                        x={denorm(kp.x, "x", renderSize)}
                        y={denorm(kp.y, "y", renderSize)}
                        radius={3}
                        fill="cyan"
                        stroke="black"
                        strokeWidth={1}
                      />
                      <Text
                        x={denorm(kp.x, "x", renderSize) + 5}
                        y={denorm(kp.y, "y", renderSize) - 10}
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
              x={denorm(placingKeypoints.baseBox[0], "x", renderSize)}
              y={denorm(placingKeypoints.baseBox[1], "y", renderSize)}
              width={denorm(placingKeypoints.baseBox[2], "x", renderSize)}
              height={denorm(placingKeypoints.baseBox[3], "y", renderSize)}
              stroke="lime"
              strokeWidth={2}
              dash={[4, 4]}
            />
            {placingKeypoints.points.map((kp, i) =>
              kp.visible !== 0 ? (
                <Circle
                  key={i}
                  x={denorm(kp.x, "x", renderSize)}
                  y={denorm(kp.y, "y", renderSize)}
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
              points={[0, mousePos[1], renderSize.width, mousePos[1]]}
              stroke="white"
              dash={[4, 4]}
              opacity={0.75}
            />
            <Line
              points={[mousePos[0], 0, mousePos[0], renderSize.height]}
              stroke="white"
              dash={[4, 4]}
              opacity={0.75}
            />
            {placingKeypoints && (
              <Text
                x={mousePos[0] + 7.5}
                y={mousePos[1] - 20}
                text={
                  placingKeypoints.keypoints[placingKeypoints.currentIdx].name
                }
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
