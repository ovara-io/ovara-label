import React, { useEffect, useRef, useState } from "react";
import { useParams } from "wouter";
import { useOvaraStore } from "@/hooks/useOvaraStore";
import { useImagePageStore } from "@/hooks/useImagePageStore";
import { ImageCanvas } from "@/components/canvas/ImageCanvas";
import { Sidebar } from "@/components/canvas/Sidebar";

const sceneWidth = 1000;
const sceneHeight = 1000;

export const ImagePage = () => {
  const { id, index } = useParams<{ id: string; index: string }>();
  const containerRef = useRef<HTMLDivElement>(null);

  const setSelectedClassId = useImagePageStore((s) => s.setSelectedClassId);

  const projects = useOvaraStore((state) => state.projects);
  const project = projects.find((p) => p.id === id);
  const imagePath = project?.imagePaths?.[Number(index)] ?? "";

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [stageSize, setStageSize] = useState({
    width: sceneWidth,
    height: sceneHeight,
    scale: 1,
  });

  useEffect(() => {
    if (!imagePath) return;
    const img = new window.Image();
    img.src = imagePath;
    img.onload = () => setImage(img);
  }, [imagePath]);

  useEffect(() => {
    if (project?.classes.length) {
      setSelectedClassId(project.classes[0].id);
    }
  }, [project?.classes]);

  const updateSize = () => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    const scale = containerWidth / sceneWidth;
    setStageSize({
      width: sceneWidth * scale,
      height: sceneHeight * scale,
      scale,
    });
  };

  useEffect(() => {
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <div className="flex h-full w-full">
      <Sidebar project={project} imagePath={imagePath} />
      <div
        className="relative flex h-full w-full items-center overflow-x-hidden overflow-y-auto"
        ref={containerRef}
      >
        <ImageCanvas
          project={project}
          imagePath={imagePath}
          image={image}
          stageSize={stageSize}
        />
      </div>
    </div>
  );
};
