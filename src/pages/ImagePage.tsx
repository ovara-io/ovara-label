import React, { useEffect, useRef, useState } from "react";
import { useParams } from "wouter";
import { useOvaraStore } from "@/hooks/useOvaraStore";
import { useImagePageStore } from "@/hooks/useImagePageStore";
import { ImageCanvas } from "@/components/canvas/ImageCanvas";
import { Sidebar } from "@/components/canvas/Sidebar";

export const ImagePage = () => {
  const { id, index } = useParams<{ id: string; index: string }>();
  const containerRef = useRef<HTMLDivElement>(null);

  const setSelectedClassId = useImagePageStore((s) => s.setSelectedClassId);

  const projects = useOvaraStore((state) => state.projects);
  const project = projects.find((p) => p.id === id);
  const imagePath = project?.imagePaths?.[Number(index)] ?? "";

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [renderSize, setRenderSize] = useState({ width: 100, height: 100 });

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

  const updateRenderSize = () => {
    if (!containerRef.current || !image) return;
    const containerWidth = containerRef.current.offsetWidth;
    const aspectRatio = image.height / image.width;
    setRenderSize({
      width: containerWidth,
      height: containerWidth * aspectRatio,
    });
  };

  useEffect(() => {
    updateRenderSize();
    window.addEventListener("resize", updateRenderSize);
    return () => window.removeEventListener("resize", updateRenderSize);
  }, [image]); // only recalc when image loads

  return (
    <div className="flex h-full w-full">
      <Sidebar project={project} imagePath={imagePath} />
      <div
        className="relative flex h-full w-full items-center overflow-x-hidden overflow-y-auto"
        ref={containerRef}
      >
        {image && (
          <ImageCanvas
            project={project}
            imagePath={imagePath}
            image={image}
            renderSize={renderSize}
          />
        )}
      </div>
    </div>
  );
};
