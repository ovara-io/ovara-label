import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useOvaraStore } from "@/hooks/useOvaraStore";
import { useShallow } from "zustand/react/shallow";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { exportYoloLabels } from "@/lib/export-utils";
import { toast } from "sonner";

interface ImagePreviewProps {
  src: string;
  alt: string;
  onClick: () => void;
  numLabels: number;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  src,
  alt,
  onClick,
  numLabels,
}) => {
  const isLabelled = numLabels > 0;
  return (
    <div className="cursor-pointer space-y-1 border p-1" onClick={onClick}>
      <img src={src} alt={alt} className="h-32 w-full object-contain" />
      <div
        className={cn(
          "text-muted-foreground text-center text-sm",
          isLabelled && "font-semibold text-green-400",
        )}
      >
        {isLabelled ? `[${numLabels}] Labelled` : "Unlabelled"}
      </div>
    </div>
  );
};
interface ImagePreviewsProps {
  projectId: string;
  imageDir: string;
}

const IMAGES_PER_PAGE = 6;

export const ImagePreviews = ({ projectId, imageDir }: ImagePreviewsProps) => {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "labelled" | "unlabelled">(
    "all",
  );
  const [, navigate] = useLocation();

  const [project, updateProjectImagePaths] = useOvaraStore(
    useShallow((state) => {
      const p = state.projects.find((p) => p.id === projectId);
      return [p, state.updateProjectImagePaths];
    }),
  );

  useEffect(() => {
    if (!imageDir) return;

    window.electron
      .getImagePaths(imageDir)
      .then((paths) => {
        updateProjectImagePaths(projectId, paths);
        setPage(1);
      })
      .catch((err) => {
        console.error("Failed to get image paths:", err);
        updateProjectImagePaths(projectId, []);
      });
  }, [imageDir, projectId, updateProjectImagePaths]);

  if (!project) return null;

  const annotations = project.annotations ?? {};
  const isLabelled = (path: string) => (annotations[path]?.length ?? 0) > 0;

  const filteredImages = project.imagePaths.filter((path) => {
    if (filter === "all") return true;
    if (filter === "labelled") return isLabelled(path);
    if (filter === "unlabelled") return !isLabelled(path);
    return true;
  });

  const totalPages = Math.ceil(filteredImages.length / IMAGES_PER_PAGE);
  const start = (page - 1) * IMAGES_PER_PAGE;
  const currentImages = filteredImages.slice(start, start + IMAGES_PER_PAGE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl">Image Previews</h2>
        <h3>{filteredImages.length} image(s)</h3>
        <Select
          value={filter}
          onValueChange={(val) => {
            setFilter(val as "all" | "labelled" | "unlabelled");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="labelled">Labelled</SelectItem>
            <SelectItem value="unlabelled">Unlabelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6">
        {currentImages.map((imgPath) => {
          const index = project.imagePaths.indexOf(imgPath);
          const numLabels = annotations[imgPath]?.length ?? 0;

          return (
            <ImagePreview
              key={imgPath}
              src={imgPath}
              alt={`image-${index}`}
              numLabels={numLabels}
              onClick={() => navigate(`/project/${projectId}/image/${index}`)}
            />
          );
        })}
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                isActive={page !== 1}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="px-2 text-sm">
                Page {page} of {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                isActive={page !== totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      <div className={"flex justify-end"}>
        <Button
          variant="destructive"
          className="px-8"
          onClick={async () => {
            await exportYoloLabels(project);
            toast("Export complete", {
              description: `YOLO labels saved to ${imageDir}.`,
            });
          }}
        >
          Export Labels
        </Button>
      </div>
    </div>
  );
};
