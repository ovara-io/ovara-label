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
import { Visibility, PoseAnnotation, PoseClass, Project } from "@/classes";
import { denorm, imageToScreen, norm, screenToImage } from "@/lib/canvas-utils";
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
  const [viewport, setViewport] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [zoomBox, setZoomBox] = useState<{
    start: [number, number];
    end: [number, number];
  } | null>(null);

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
  const canvasWidth = renderSize.width;
  const canvasHeight = renderSize.height;

  function getNextColor(): string {
    const anns = project.annotations[imagePath] ?? [];
    const used = new Set(anns.map((a) => a.color));
    const unused = ANNOTATION_COLORS.find((c) => !used.has(c));

    return (
      unused ??
      ANNOTATION_COLORS[Math.floor(Math.random() * ANNOTATION_COLORS.length)]
    );
  }

  function toNormalizedImageCoords(
    screenX: number,
    screenY: number,
  ): [number, number] {
    const [imgX, imgY] = screenToImage(
      screenX,
      screenY,
      containerSize,
      viewport,
    );
    return [norm(imgX, renderSize.width), norm(imgY, renderSize.height)];
  }

  function toScreenCoords(normX: number, normY: number): [number, number] {
    const imgX = denorm(normX, renderSize.width);
    const imgY = denorm(normY, renderSize.height);
    return imageToScreen(imgX, imgY, containerSize, viewport);
  }

  // TODO project by default, unproject when rendering.. right? unproject → norm before storing, then when rendering, unproject and denorm

  // TODO should we actually project in setDrawingBox calls too..? probably...
  // === CREATE MODE ===
  function handleCreateMouseDown(pos: { x: number; y: number }) {
    if (placingKeypoints) {
      const current = placingKeypoints.keypoints[placingKeypoints.currentIdx];
      const [x, y] = toNormalizedImageCoords(pos.x, pos.y);

      const updated = [
        ...placingKeypoints.points,
        {
          id: current.id,
          x,
          y,
          visible: Visibility.LabeledVisible,
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
          // TODO project here
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
      // TODO project here
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

  const handleZoomMouseDown = (pos: { x: number; y: number }) => {
    setZoomBox({ start: [pos.x, pos.y], end: [pos.x, pos.y] });
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = e.target.getStage().getPointerPosition();
    if (!pos || e.evt.button !== 0 || e.evt.ctrlKey) return;

    if (interactionMode === "create") {
      handleCreateMouseDown(pos);
    } else if (interactionMode === "edit") {
      // handleEditMouseDown(pos);
    } else if (interactionMode === "zoom") {
      handleZoomMouseDown(pos);
    }
  };

  const handleZoomMouseMove = (pos: { x: number; y: number }) => {
    if (!zoomBox) return;
    setZoomBox({ ...zoomBox, end: [pos.x, pos.y] });
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = e.target.getStage().getPointerPosition();
    if (pos) {
      setMousePos([pos.x, pos.y]);
      if (interactionMode === "create") {
        handleCreateMouseMove(pos);
      } else if (interactionMode === "edit") {
        // handleEditMouseMove(pos);
      } else if (interactionMode === "zoom") {
        handleZoomMouseMove(pos);
      }
    }
  };

  const handleZoomMouseUp = () => {
    if (!zoomBox) return;
    const [x1, y1] = zoomBox.start;
    const [x2, y2] = zoomBox.end;
    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);
    if (width > 15 && height > 15) {
      setViewport({ x, y, width, height });
    }
    setZoomBox(null);
  };

  const handleMouseUp = () => {
    if (interactionMode === "create") {
      handleCreateMouseUp();
    } else if (interactionMode === "edit") {
      // handleEditMouseUp();
    } else if (interactionMode === "zoom") {
      handleZoomMouseUp();
    }
  };

  const placeKeypoint = () => {
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
        // TODO project here
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

  const resetZoom = () => {
    setViewport(null);
    setZoomBox(null);
  };

  const handleContextMenu = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.evt.preventDefault();

    if (interactionMode === "zoom") {
      resetZoom();
      return;
    } else if (interactionMode === "create") {
      const pos = e.target.getStage().getPointerPosition();
      if (!pos) return;

      if (placingKeypoints) {
        placeKeypoint();
      } else {
        deleteAnnotationUnderCursor(pos);
      }
    }
  };
  const [topLeftX, topLeftY] = imageToScreen(0, 0, containerSize, viewport);
  const [bottomRightX, bottomRightY] = imageToScreen(
    renderSize.width,
    renderSize.height,
    containerSize,
    viewport,
  );
  return (
    <Stage
      width={canvasWidth}
      height={canvasHeight}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
      style={{ cursor: "none" }}
    >
      <Layer>
        <KonvaImage
          image={image}
          x={topLeftX}
          y={topLeftY}
          width={bottomRightX - topLeftX}
          height={bottomRightY - topLeftY}
        />

        {/*place existing bounding boxes and keypoints from projection*/}
        {(project.annotations?.[imagePath] ?? []).map((ann, i) => {
          const [nx, ny, nw, nh] = ann.bbox;
          const [x, y] = toScreenCoords(nx, ny);
          const [x2, y2] = toScreenCoords(nx + nw, ny + nh);
          const w = x2 - x;
          const h = y2 - y;

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
                (ann as PoseAnnotation).keypoints?.map((kp, j) => {
                  if (kp.visible === 0) return null;

                  const [x, y] = toScreenCoords(kp.x, kp.y);
                  return (
                    <React.Fragment key={j}>
                      <Circle
                        x={x}
                        y={y}
                        radius={3}
                        fill={ann.color}
                        stroke="black"
                        strokeWidth={1}
                      />
                      <Text
                        x={x + 5}
                        y={y - 10}
                        text={(cls as PoseClass)?.keypoints[j]?.name ?? kp.id}
                        fontSize={10}
                        fill="white"
                      />
                    </React.Fragment>
                  );
                })}
            </React.Fragment>
          );
        })}

        {/*in progress pose bounding box and keypoints from projection*/}
        {placingKeypoints && (
          <Group>
            <Rect
              x={
                toScreenCoords(
                  placingKeypoints.baseBox[0],
                  placingKeypoints.baseBox[1],
                )[0]
              }
              y={
                toScreenCoords(
                  placingKeypoints.baseBox[0],
                  placingKeypoints.baseBox[1],
                )[1]
              }
              width={
                toScreenCoords(
                  placingKeypoints.baseBox[2],
                  placingKeypoints.baseBox[3],
                )[0]
              }
              height={
                toScreenCoords(
                  placingKeypoints.baseBox[2],
                  placingKeypoints.baseBox[3],
                )[1]
              }
              stroke="lime"
              strokeWidth={2}
            />
            {placingKeypoints.points.map((kp, i) => {
              if (kp.visible === 0) return null;

              const [x, y] = toScreenCoords(kp.x, kp.y);

              return (
                <Circle
                  key={i}
                  x={x}
                  y={y}
                  radius={3}
                  fill="lime"
                  stroke="black"
                  strokeWidth={1}
                />
              );
            })}
          </Group>
        )}

        {/*drawing box natively in screen space*/}
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

        {/*zoom rect natively in screen space*/}
        {zoomBox?.start && mousePos && (
          <Rect
            x={Math.min(zoomBox.start[0], mousePos[0])}
            y={Math.min(zoomBox.start[1], mousePos[1])}
            width={Math.abs(zoomBox.start[0] - mousePos[0])}
            height={Math.abs(zoomBox.start[1] - mousePos[1])}
            stroke="cyan"
            strokeWidth={2}
            dash={[4, 2]}
          />
        )}
        {/*render where the mouse is with 1 horizontal and 1 vertical line natively in screen space*/}
        {mousePos && (
          <>
            <Line
              points={[0, mousePos[1], canvasWidth, mousePos[1]]}
              stroke="white"
              dash={[4, 4]}
              opacity={0.75}
            />
            <Line
              points={[mousePos[0], 0, mousePos[0], canvasHeight]}
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
