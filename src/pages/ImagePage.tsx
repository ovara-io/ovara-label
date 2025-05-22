import React, { useEffect, useRef, useState } from "react";
import { useParams } from "wouter";
import { useOvaraStore } from "@/hooks/useOvaraStore";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const ImagePage = () => {
  const { id, index } = useParams<{ id: string; index: string }>();
  const project = useOvaraStore((state) => state.projects).find(
    (p) => p.id === id,
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [mouseOffset, setMouseOffset] = useState<[number, number]>([0, 0]);
  const [mousePos, setMousePos] = useState<[number, number] | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const imageUrl = project?.imagePaths?.[Number(index)];

  useEffect(() => {
    if (!imageUrl || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = imageUrl;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      setImgElement(img);
    };
  }, [imageUrl]);

  useEffect(() => {
    if (!canvasRef.current || !imgElement) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas and redraw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgElement, 0, 0);

    // Draw guiding lines
    if (mousePos) {
      const [x, y] = mousePos;
      const [offsetX, offsetY] = mouseOffset;

      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath();
      ctx.moveTo(0, y + offsetY);
      ctx.lineTo(canvas.width, y + offsetY);
      ctx.moveTo(x + offsetX, 0);
      ctx.lineTo(x + offsetX, canvas.height);
      ctx.stroke();
    }
  }, [mousePos, mouseOffset, imgElement]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos([x, y]);
  };

  if (!project || !imageUrl) {
    return <div className="p-4 text-red-500">Image not found</div>;
  }

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      <div className="bg-muted w-64 space-y-4 border-r p-4">
        <h2 className="text-lg font-semibold">Classes</h2>
        <div className="space-y-1">
          {project.classes.map((cls) => (
            <Button
              key={cls.id}
              variant={cls.id === selectedClassId ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => setSelectedClassId(cls.id)}
            >
              {cls.name}
            </Button>
          ))}
        </div>

        <Separator className="my-4" />
        <h3 className="text-sm font-medium">Offset</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => setMouseOffset((x) => [x[0] - 10, x[1] - 10])}>
            ↖
          </Button>
          <Button onClick={() => setMouseOffset((x) => [x[0] + 10, x[1] - 10])}>
            ↗
          </Button>
          <Button onClick={() => setMouseOffset((x) => [x[0] - 10, x[1] + 10])}>
            ↙
          </Button>
          <Button onClick={() => setMouseOffset((x) => [x[0] + 10, x[1] + 10])}>
            ↘
          </Button>
        </div>
        <div className="text-muted-foreground pt-2 text-xs">
          Current offset: {mouseOffset[0]}, {mouseOffset[1]}
        </div>
      </div>

      <div className="relative flex-1 bg-black">
        <canvas
          ref={canvasRef}
          className="h-full w-full"
          onMouseMove={handleMouseMove}
        />
      </div>
    </div>
  );
};
