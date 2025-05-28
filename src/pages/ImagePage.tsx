import React, { useEffect, useRef, useState } from "react";
import { useParams } from "wouter";
import { useProjectStore } from "@/hooks/useProjectStore";
import { useImagePageStore } from "@/hooks/useImagePageStore";
import { ImageCanvas } from "@/components/canvas/ImageCanvas";
import { Toolbar } from "@/components/canvas/Toolbar";
import { ImageSidebar } from "@/components/canvas/ImageSidebar";

export const ImagePage = () => {
  const { id, index } = useParams<{ id: string; index: string }>();
  const containerRef = useRef<HTMLDivElement>(null);

  const setSelectedClassId = useImagePageStore((s) => s.setSelectedClassId);

  const projects = useProjectStore((state) => state.projects);
  const project = projects.find((p) => p.id === id);
  const imagePath = project?.imagePaths?.[Number(index)] ?? "";

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [containerSize, setContainerSize] = useState({
    width: 100,
    height: 100,
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

  const updateContainerSize = () => {
    if (!containerRef.current) return;
    setContainerSize({
      width: containerRef.current.offsetWidth,
      height: containerRef.current.offsetHeight,
    });
  };

  useEffect(() => {
    updateContainerSize();
    window.addEventListener("resize", updateContainerSize);
    return () => window.removeEventListener("resize", updateContainerSize);
  }, []);

  return (
    <>
      <div className="flex h-full w-full">
        <ImageSidebar project={project} imagePath={imagePath} />
        <div className="relative flex h-full w-full flex-col overflow-auto">
          <Toolbar />

          <div
            className="relative flex h-full w-full items-center justify-center overflow-auto"
            ref={containerRef}
          >
            {image && (
              <ImageCanvas
                project={project}
                imagePath={imagePath}
                image={image}
                containerSize={containerSize}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};
