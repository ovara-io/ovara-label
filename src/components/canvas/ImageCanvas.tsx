import React, { useMemo, useState } from "react";
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
import { useProjectStore } from "@/hooks/useProjectStore";
import { useImagePageStore } from "@/hooks/useImagePageStore";
import {
  KeypointVisibility,
  PoseAnnotation,
  PoseClass,
  Project,
} from "@/classes";
import { denorm, norm } from "@/lib/canvas-utils";
import Konva from "konva";
import { ANNOTATION_COLORS } from "@/consts";

interface ImageCanvasProps {
  project: Project;
  imagePath: string;
  image: HTMLImageElement | null;
  containerSize: { width: number; height: number };
}

export const ImageCanvas: React.FC<ImageCanvasProps> = ({
  project,
  imagePath,
  image,
  containerSize,
}) => {
  const addImageAnnotation = useProjectStore((s) => s.addImageAnnotation);
  const deleteImageAnnotationByIndex = useProjectStore(
    (s) => s.deleteImageAnnotationByIndex,
  );
  const selectedClassId = useImagePageStore((s) => s.selectedClassId);
  const clickMode = useImagePageStore((s) => s.clickMode);
  const drawingBox = useImagePageStore((s) => s.drawingBox);
  const setDrawingBox = useImagePageStore((s) => s.setDrawingBox);
  const placingKeypoints = useImagePageStore((s) => s.placingKeypoints);
  const setPlacingKeypoints = useImagePageStore((s) => s.setPlacingKeypoints);
  const imageType = useImagePageStore((s) => s.imageType);
  const interactionMode = useImagePageStore((s) => s.interactionMode);

  const [mousePos, setMousePos] = useState<[number, number] | null>(null);

  const renderSize = useMemo(() => {
    const imageAspect = image.width / image.height;
    const { width: containerWidth, height: containerHeight } = containerSize;

    if (imageType === "stretch") {
      return { width: containerWidth, height: containerHeight };
    }

    const containerAspect = containerWidth / containerHeight;
    if (imageAspect > containerAspect) {
      return {
        width: containerWidth,
        height: containerWidth / imageAspect,
      };
    } else {
      return {
        height: containerHeight,
        width: containerHeight * imageAspect,
      };
    }
  }, [
    image.width,
    image.height,
    containerSize.width,
    containerSize.height,
    imageType,
  ]);

  function getNextColor(): string {
    const anns = project.annotations[imagePath] ?? [];
    const used = new Set(anns.map((a) => a.color));
    const unused = ANNOTATION_COLORS.find((c) => !used.has(c));

    return (
      unused ??
      ANNOTATION_COLORS[Math.floor(Math.random() * ANNOTATION_COLORS.length)]
    );
  }

  // === CREATE MODE ===
  function handleCreateMouseDown(pos: { x: number; y: number }) {
    if (placingKeypoints) {
      const current = placingKeypoints.keypoints[placingKeypoints.currentIdx];
      const updated = [
        ...placingKeypoints.points,
        {
          id: current.id,
          x: norm(pos.x, renderSize.width),
          y: norm(pos.y, renderSize.height),
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
          color: getNextColor(),
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

    if (!selectedClassId) return;

    if (clickMode === "drag") {
      setDrawingBox({ start: [pos.x, pos.y], end: [pos.x, pos.y] });
    } else if (clickMode === "click") {
      if (!drawingBox) {
        setDrawingBox({ start: [pos.x, pos.y], end: [pos.x, pos.y] });
      } else {
        const [x1, y1] = drawingBox.start;
        const [x2, y2] = [pos.x, pos.y];
        const x = Math.min(x1, x2);
        const y = Math.min(y1, y2);
        const width = Math.abs(x2 - x1);
        const height = Math.abs(y2 - y1);

        if (width >= 5 && height >= 5) {
          const bbox: [number, number, number, number] = [
            norm(x, renderSize.width),
            norm(y, renderSize.height),
            norm(width, renderSize.width),
            norm(height, renderSize.height),
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
              color: getNextColor(),
            });
          }
        }

        setDrawingBox(null);
      }
    }
  }

  function handleCreateMouseMove(pos: { x: number; y: number }) {
    if (clickMode === "drag" && drawingBox) {
      setDrawingBox({ ...drawingBox, end: [pos.x, pos.y] });
    }
  }

  function handleCreateMouseUp() {
    if (clickMode !== "drag" || !drawingBox || !selectedClassId) return;

    const [x1, y1] = drawingBox.start;
    const [x2, y2] = drawingBox.end;
    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);

    if (width >= 5 && height >= 5) {
      const bbox: [number, number, number, number] = [
        norm(x, renderSize.width),
        norm(y, renderSize.height),
        norm(width, renderSize.width),
        norm(height, renderSize.height),
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
          color: getNextColor(),
        });
      }
    }

    setDrawingBox(null);
  }

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = e.target.getStage().getPointerPosition();
    if (!pos || e.evt.button !== 0 || e.evt.ctrlKey) return;

    if (interactionMode === "create") {
      handleCreateMouseDown(pos);
    } else if (interactionMode === "edit") {
      // handleEditMouseDown(pos);
    } else if (interactionMode === "zoom") {
      // handleZoomMouseDown(e);
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = e.target.getStage().getPointerPosition();
    if (pos) {
      setMousePos([pos.x, pos.y]);
      if (interactionMode === "create") {
        handleCreateMouseMove(pos);
      } else if (interactionMode === "edit") {
        // handleEditMouseMove(pos);
      }
    }
  };

  const handleMouseUp = () => {
    if (interactionMode === "create") {
      handleCreateMouseUp();
    } else if (interactionMode === "edit") {
      // handleEditMouseUp();
    }
  };

  const skipKeypoint = () => {
    if (!placingKeypoints) return;

    const current = placingKeypoints.keypoints[placingKeypoints.currentIdx];
    const updated = [
      ...placingKeypoints.points,
      { id: current.id, x: 0, y: 0, visible: 0 },
    ];

    const isLast =
      placingKeypoints.currentIdx + 1 === placingKeypoints.keypoints.length;

    if (isLast) {
      addImageAnnotation(project.id, imagePath, {
        classId: selectedClassId,
        bbox: placingKeypoints.baseBox,
        keypoints: updated,
        color: getNextColor(),
      });
      setPlacingKeypoints(null);
    } else {
      setPlacingKeypoints({
        ...placingKeypoints,
        currentIdx: placingKeypoints.currentIdx + 1,
        points: updated,
      });
    }
  };

  const deleteAnnotationUnderCursor = (pos: { x: number; y: number }) => {
    const anns = project.annotations[imagePath] ?? [];
    const toDeleteIdx = anns
      .map((ann, i) => ({ ...ann, i }))
      .reverse()
      .find((ann) => {
        const [x, y, w, h] = ann.bbox;
        return (
          pos.x >= denorm(x, renderSize.width) &&
          pos.x <= denorm(x + w, renderSize.width) &&
          pos.y >= denorm(y, renderSize.height) &&
          pos.y <= denorm(y + h, renderSize.height)
        );
      })?.i;

    if (toDeleteIdx !== undefined) {
      deleteImageAnnotationByIndex(project.id, imagePath, toDeleteIdx);
    }
  };

  const handleContextMenu = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.evt.preventDefault();

    if (interactionMode === "zoom") {
      // resetZoom();
      return;
    } else if (interactionMode === "create") {
      const pos = e.target.getStage().getPointerPosition();
      if (!pos) return;

      if (placingKeypoints) {
        skipKeypoint();
      } else {
        deleteAnnotationUnderCursor(pos);
      }
    }
  };

  return (
    <Stage
      width={renderSize.width}
      height={renderSize.height}
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
          height={renderSize.height}
        />

        {(project.annotations?.[imagePath] ?? []).map((ann, i) => {
          const [nx, ny, nw, nh] = ann.bbox;
          const x = denorm(nx, renderSize.width);
          const y = denorm(ny, renderSize.height);
          const w = denorm(nw, renderSize.width);
          const h = denorm(nh, renderSize.height);

          const cls = project.classes.find((c) => c.id === ann.classId);
          return (
            <React.Fragment key={i}>
              <Rect
                x={x}
                y={y}
                width={w}
                height={h}
                stroke={ann.color}
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
                        x={denorm(kp.x, renderSize.width)}
                        y={denorm(kp.y, renderSize.height)}
                        radius={3}
                        fill={ann.color}
                        stroke="black"
                        strokeWidth={1}
                      />
                      <Text
                        x={denorm(kp.x, renderSize.width) + 5}
                        y={denorm(kp.y, renderSize.height) - 10}
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
            stroke="lime"
            strokeWidth={2}
            dash={[4, 2]}
          />
        )}

        {placingKeypoints && (
          <Group>
            <Rect
              x={denorm(placingKeypoints.baseBox[0], renderSize.width)}
              y={denorm(placingKeypoints.baseBox[1], renderSize.height)}
              width={denorm(placingKeypoints.baseBox[2], renderSize.width)}
              height={denorm(placingKeypoints.baseBox[3], renderSize.height)}
              stroke="lime"
              strokeWidth={2}
            />
            {placingKeypoints.points.map((kp, i) =>
              kp.visible !== 0 ? (
                <Circle
                  key={i}
                  x={denorm(kp.x, renderSize.width)}
                  y={denorm(kp.y, renderSize.height)}
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
                fontSize={14}
                fill="yellow"
              />
            )}
            {interactionMode === "create" &&
              selectedClassId &&
              !placingKeypoints && (
                <Text
                  x={mousePos[0] + 7.5}
                  y={mousePos[1] - 20}
                  text={
                    project.classes.find((c) => c.id === selectedClassId)
                      ?.name ?? "?"
                  }
                  fontSize={14}
                  fill="yellow"
                />
              )}
          </>
        )}
      </Layer>
    </Stage>
  );
};
