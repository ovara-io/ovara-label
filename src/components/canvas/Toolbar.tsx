import React from "react";
import { useImagePageStore } from "@/hooks/useImagePageStore";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Expand, Maximize2, Move, Pencil, ZoomIn } from "lucide-react";

export const Toolbar = () => {
  const imageType = useImagePageStore((s) => s.imageType);
  const setImageType = useImagePageStore((s) => s.setImageType);
  const interactionMode = useImagePageStore((s) => s.interactionMode);
  const setInteractionMode = useImagePageStore((s) => s.setInteractionMode);

  return (
    <TooltipProvider>
      <div className="border-border flex justify-between border-b px-4 py-2">
        <div className="flex items-center gap-4">
          <ToggleGroup
            type="single"
            value={imageType}
            onValueChange={(val) =>
              val && setImageType(val as "fit" | "stretch")
            }
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <ToggleGroupItem value="fit" aria-label="Fit to screen">
                    <Maximize2 className="h-4 w-4" />
                  </ToggleGroupItem>
                </div>
              </TooltipTrigger>
              <TooltipContent>Fit image to screen</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <ToggleGroupItem value="stretch" aria-label="Stretch to fill">
                    <Expand className="h-4 w-4" />
                  </ToggleGroupItem>
                </div>
              </TooltipTrigger>
              <TooltipContent>Stretch image to fill area</TooltipContent>
            </Tooltip>
          </ToggleGroup>
        </div>

        <div className="flex items-center gap-4">
          <ToggleGroup
            type="single"
            value={interactionMode}
            onValueChange={(val) =>
              val && setInteractionMode(val as "create" | "edit" | "zoom")
            }
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <ToggleGroupItem value="create" aria-label="Create mode">
                    <Pencil className="h-4 w-4" />
                  </ToggleGroupItem>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                Create: Draw boxes or place keypoints
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <ToggleGroupItem value="edit" aria-label="Edit mode">
                    <Move className="h-4 w-4" />
                  </ToggleGroupItem>
                </div>
              </TooltipTrigger>
              <TooltipContent>Edit: Move boxes or keypoints</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <ToggleGroupItem value="zoom" aria-label="Zoom mode">
                    <ZoomIn className="h-4 w-4" />
                  </ToggleGroupItem>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                Zoom: Left-click to zoom in, right-click to zoom out
              </TooltipContent>
            </Tooltip>
          </ToggleGroup>
        </div>
      </div>
    </TooltipProvider>
  );
};
