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
import { PoseAnnotation, PoseClass, Project, Visibility } from "@/classes";
import { denorm, imageToScreen, norm, screenToImage } from "@/lib/canvas-utils";
import Konva from "konva";
import { ANNOTATION_COLORS } from "@/consts";

interface ImageCanvasProps {
  project: Project;
  imagePath: string;
  image: HTMLImageElement | null;
  containerSize: { width: number; height: number };
}

// TODO should we actually project in setDrawingBox/setZoomBox calls too..? probably... that way if we zoom mid place, everythings still correct
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
    const aspect = image.width / image.height;
    const { width: containerWidth, height: containerHeight } = containerSize;

    if (imageType === "stretch") {
      return {
        width: containerWidth,
        height: containerHeight,
        aspect,
      };
    }

    const containerAspect = containerWidth / containerHeight;
    if (aspect > containerAspect) {
      return {
        width: containerWidth,
        height: containerWidth / aspect,
        aspect,
      };
    } else {
      return {
        height: containerHeight,
        width: containerHeight * aspect,
        aspect,
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

  function toScreenCoords(normX: number, normY: number): [number, number] {
    const imgX = denorm(normX, renderSize.width);
    const imgY = denorm(normY, renderSize.height);
    return imageToScreen(imgX, imgY, renderSize, viewport);
  }

  function toNormalizedImageCoords(
    screenX: number,
    screenY: number,
  ): [number, number] {
    const [imgX, imgY] = screenToImage(screenX, screenY, renderSize, viewport);
    return [norm(imgX, renderSize.width), norm(imgY, renderSize.height)];
  }

  function screenBoxToNormalizedBox(
    start: [number, number],
    end: [number, number],
  ): { x: number; y: number; width: number; height: number } {
    const [x1, y1] = toNormalizedImageCoords(start[0], start[1]);
    const [x2, y2] = toNormalizedImageCoords(end[0], end[1]);

    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);

    return { x, y, width, height };
  }

  function getAspectLockedZoomBox(
    start: [number, number],
    current: [number, number],
    aspectRatio: number,
  ): { x: number; y: number; width: number; height: number } {
    const [x1, y1] = start;
    let dx = current[0] - x1;
    let dy = current[1] - y1;

    // Lock aspect ratio
    if (Math.abs(dx / dy) > aspectRatio) {
      dy = (Math.sign(dy) * Math.abs(dx)) / aspectRatio;
    } else {
      dx = Math.sign(dx) * Math.abs(dy) * aspectRatio;
    }

    const x = dx < 0 ? x1 + dx : x1;
    const y = dy < 0 ? y1 + dy : y1;

    return {
      x,
      y,
      width: Math.abs(dx),
      height: Math.abs(dy),
    };
  }

  const zoomBoxPreview = useMemo(() => {
    if (!zoomBox?.start || !mousePos) return null;

    const canvasAspect = renderSize.width / renderSize.height;
    const { x, y, width, height } = getAspectLockedZoomBox(
      zoomBox.start,
      mousePos,
      canvasAspect,
    );

    return { x, y, width, height };
  }, [zoomBox, mousePos, renderSize]);

  // === CREATE MODE ===
  const createBox = (start: [number, number], end: [number, number]) => {
    const bbox = screenBoxToNormalizedBox(start, end);

    const minSizeNormX = 5 / renderSize.width;
    const minSizeNormY = 5 / renderSize.height;
    if (bbox.width >= minSizeNormX && bbox.height >= minSizeNormY) {
      // bbox is ready to use
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
  };

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
        createBox(drawingBox.start, [pos.x, pos.y]);
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
    createBox(drawingBox.start, drawingBox.end);
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

    const { x, y, width, height } = zoomBoxPreview;

    if (width > 0.01 && height > 0.01) {
      // Convert the zoom box (screen-space) back into normalized image space
      const [startNormX, startNormY] = screenToImage(
        x,
        y,
        renderSize,
        viewport,
      );
      const [endNormX, endNormY] = screenToImage(
        x + width,
        y + height,
        renderSize,
        viewport,
      );

      const zoomedX = Math.min(startNormX, endNormX);
      const zoomedY = Math.min(startNormY, endNormY);
      const zoomedWidth = Math.abs(endNormX - startNormX);
      const zoomedHeight = Math.abs(endNormY - startNormY);

      setViewport({
        x: zoomedX,
        y: zoomedY,
        width: zoomedWidth,
        height: zoomedHeight,
      });
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
        const { x, y, width, height } = ann.bbox;

        const [sx, sy] = toScreenCoords(x, y);
        const [ex, ey] = toScreenCoords(x + width, y + height);

        return pos.x >= sx && pos.x <= ex && pos.y >= sy && pos.y <= ey;
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
        skipKeypoint();
      } else {
        deleteAnnotationUnderCursor(pos);
      }
    }
  };
  const [topLeftX, topLeftY] = imageToScreen(0, 0, renderSize, viewport);
  const [bottomRightX, bottomRightY] = imageToScreen(
    renderSize.width,
    renderSize.height,
    renderSize,
    viewport,
  );
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
          x={topLeftX}
          y={topLeftY}
          width={bottomRightX - topLeftX}
          height={bottomRightY - topLeftY}
        />

        {/*place existing bounding boxes and keypoints from projection*/}
        {(project.annotations?.[imagePath] ?? []).map((ann, i) => {
          const { x: nx, y: ny, width: nw, height: nh } = ann.bbox;
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
        {placingKeypoints &&
          (() => {
            const {
              x: normX,
              y: normY,
              width: normW,
              height: normH,
            } = placingKeypoints.baseBox;

            const [screenX, screenY] = toScreenCoords(normX, normY);
            const [screenX2, screenY2] = toScreenCoords(
              normX + normW,
              normY + normH,
            );

            return (
              <Group>
                <Rect
                  x={screenX}
                  y={screenY}
                  width={screenX2 - screenX}
                  height={screenY2 - screenY}
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
            );
          })()}

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
        {zoomBoxPreview && (
          <Rect
            x={zoomBoxPreview.x}
            y={zoomBoxPreview.y}
            width={zoomBoxPreview.width}
            height={zoomBoxPreview.height}
            stroke="cyan"
            strokeWidth={2}
            dash={[4, 2]}
          />
        )}

        {/*render where the mouse is with 1 horizontal and 1 vertical line natively in screen space*/}
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
