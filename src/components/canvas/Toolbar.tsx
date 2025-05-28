import React from "react";
import { useImagePageStore } from "@/hooks/useImagePageStore";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Expand,
  Maximize2,
  MousePointerClick,
  MousePointerSquareDashed,
  Move,
  Pencil,
  ZoomIn,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const Toolbar = () => {
  const imageType = useImagePageStore((s) => s.imageType);
  const setImageType = useImagePageStore((s) => s.setImageType);
  const interactionMode = useImagePageStore((s) => s.interactionMode);
  const setInteractionMode = useImagePageStore((s) => s.setInteractionMode);
  const clickMode = useImagePageStore((s) => s.clickMode);
  const setClickMode = useImagePageStore((s) => s.setClickMode);

  return (
    <TooltipProvider>
      <div className="flex justify-between border-b p-2">
        <ToggleGroup
          type="single"
          value={imageType}
          onValueChange={(val) => val && setImageType(val as "fit" | "stretch")}
          className="gap-1"
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

        <div className="flex items-center gap-4">
          <ToggleGroup
            type="single"
            value={clickMode}
            onValueChange={(val) =>
              val && setClickMode(val as "drag" | "click")
            }
            className="gap-1"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <ToggleGroupItem value="drag" aria-label="Click and drag">
                    <MousePointerSquareDashed className="h-4 w-4" />
                  </ToggleGroupItem>
                </div>
              </TooltipTrigger>
              <TooltipContent>Click and drag to draw</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <ToggleGroupItem value="click" aria-label="Click twice">
                    <MousePointerClick className="h-4 w-4" />
                  </ToggleGroupItem>
                </div>
              </TooltipTrigger>
              <TooltipContent>Click twice to draw</TooltipContent>
            </Tooltip>
          </ToggleGroup>

          <Separator orientation={"vertical"} />

          <ToggleGroup
            type="single"
            value={interactionMode}
            onValueChange={(val) =>
              val && setInteractionMode(val as "create" | "edit" | "zoom")
            }
            className="gap-1"
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
