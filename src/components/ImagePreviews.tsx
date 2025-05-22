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

interface ImagePreviewsProps {
  projectId: string;
  imageDir: string;
}

const IMAGES_PER_PAGE = 6;

export const ImagePreviews = ({ projectId, imageDir }: ImagePreviewsProps) => {
  const [page, setPage] = useState(1);
  const [, navigate] = useLocation();

  const [project, updateProject] = useOvaraStore(
    useShallow((state) => {
      const p = state.projects.find((p) => p.id === projectId);
      return [p, state.updateProject];
    }),
  );

  const images = project?.imagePaths ?? [];
  const totalPages = Math.ceil(images.length / IMAGES_PER_PAGE);
  const start = (page - 1) * IMAGES_PER_PAGE;
  const currentImages = images.slice(start, start + IMAGES_PER_PAGE);

  useEffect(() => {
    if (!imageDir) return;

    window.electron
      .getImagePaths(imageDir)
      .then((paths) => {
        updateProject(projectId, { imagePaths: paths });
        setPage(1);
      })
      .catch((err) => {
        console.error("Failed to get image paths:", err);
        updateProject(projectId, { imagePaths: [] });
      });
  }, [imageDir, projectId, updateProject]);

  if (!project) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Image Previews</h2>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6">
        {currentImages.map((imgPath, i) => {
          const index = start + i;
          return (
            <img
              key={imgPath}
              src={imgPath}
              alt={`image-${index}`}
              className="h-32 w-full cursor-pointer rounded border object-contain"
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
    </div>
  );
};
