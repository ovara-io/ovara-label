import React from "react";
import { useImagePageStore } from "@/hooks/useImagePageStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Annotation,
  PoseAnnotation,
  Project,
  Visible,
  PoseClass,
} from "@/classes";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  project: Project;
  imagePath: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ project, imagePath }) => {
  const selectedClassId = useImagePageStore((s) => s.selectedClassId);
  const setSelectedClassId = useImagePageStore((s) => s.setSelectedClassId);
  const clickMode = useImagePageStore((s) => s.clickMode);
  const setClickMode = useImagePageStore((s) => s.setClickMode);
  const [, navigate] = useLocation();

  const annotations: Annotation[] = project?.annotations?.[imagePath] ?? [];

  const index = project.imagePaths.findIndex((p) => p === imagePath);
  const hasPrev = index > 0;
  const hasNext = index < project.imagePaths.length - 1;

  return (
    <div className="border-border relative flex h-full w-64 shrink-0 flex-col border-r p-4">
      <div className="space-y-4 overflow-y-auto pb-20">
        <Select
          value={clickMode}
          onValueChange={(val) => setClickMode(val as "drag" | "click")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Bounding Box Mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="drag">Click and drag</SelectItem>
            <SelectItem value="click">Click twice</SelectItem>
          </SelectContent>
        </Select>

        <Separator className="my-4" />

        <h2 className="text-xl">Classes</h2>
        <div className="space-y-2">
          {project.classes.map((cls) => {
            const isSelected = cls.id === selectedClassId;
            const count = annotations.filter(
              (a) => a.classId === cls.id,
            ).length;

            return (
              <div
                key={cls.id}
                className={cn(
                  "cursor-pointer rounded border px-3 py-2 text-sm",
                  isSelected
                    ? "border-primary text-primary"
                    : "hover:border-muted border-transparent",
                )}
                onClick={() => setSelectedClassId(cls.id)}
              >
                <div>
                  [{count}] {cls.name}
                </div>

                {project.modelType === "pose" && "keypoints" in cls && (
                  <ul className="text-muted-foreground ml-4 list-disc text-xs">
                    {cls.keypoints.map((kp) => (
                      <li key={kp.id}>{kp.name}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        <Separator className="my-4" />

        <h3 className="text-xl">Placed Classes</h3>
        <div className="space-y-2 text-sm">
          {annotations.map((ann, idx) => {
            const cls = project.classes.find((c) => c.id === ann.classId);
            if (!cls) return null;

            return (
              <div key={idx} className="border-muted border-l pl-2">
                {cls.name}

                {project.modelType === "pose" &&
                  "keypoints" in cls &&
                  "keypoints" in ann && (
                    <ul className="text-muted-foreground ml-4 list-disc text-xs">
                      {(cls as PoseClass).keypoints.map((kp) => {
                        const match = (ann as PoseAnnotation).keypoints.find(
                          (k) =>
                            k.id === kp.id &&
                            k.visible === Visible.LabeledVisible,
                        );
                        return (
                          <li key={kp.id}>
                            {match ? "✅" : "❌"} {kp.name}
                          </li>
                        );
                      })}
                    </ul>
                  )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Nav buttons pinned to bottom */}
      <div className="border-border bg-background absolute right-0 bottom-0 left-0 flex justify-between border-t px-4 py-2">
        <Button
          variant="outline"
          disabled={!hasPrev}
          onClick={() =>
            hasPrev &&
            navigate(`/project/${project.id}/image/${index - 1}`, {
              replace: true,
            })
          }
        >
          Prev
        </Button>
        <Button
          variant="outline"
          disabled={!hasNext}
          onClick={() =>
            hasNext &&
            navigate(`/project/${project.id}/image/${index + 1}`, {
              replace: true,
            })
          }
        >
          Next
        </Button>
      </div>
    </div>
  );
};
