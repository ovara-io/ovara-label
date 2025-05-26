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

interface SidebarProps {
  project: Project;
  imagePath: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ project, imagePath }) => {
  const selectedClassId = useImagePageStore((s) => s.selectedClassId);
  const setSelectedClassId = useImagePageStore((s) => s.setSelectedClassId);
  const clickMode = useImagePageStore((s) => s.clickMode);
  const setClickMode = useImagePageStore((s) => s.setClickMode);

  const annotations: Annotation[] = project?.annotations?.[imagePath] ?? [];

  return (
    <div className="border-r-border h-full w-64 shrink-0 space-y-4 overflow-y-auto border-r p-4">
      <Select
        value={clickMode}
        onValueChange={(val) => setClickMode(val as "drag" | "click-twice")}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select click mode" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="drag">Click and Drag</SelectItem>
          <SelectItem value="click-twice">Click, Move, Click</SelectItem>
        </SelectContent>
      </Select>

      <Separator className="my-4" />

      <h2 className="text-lg font-semibold">Classes</h2>
      <div className="space-y-2">
        {project.classes.map((cls) => {
          const isSelected = cls.id === selectedClassId;
          const count = annotations.filter((a) => a.classId === cls.id).length;

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

      <h3 className="text-lg font-semibold">Placed Classes</h3>
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
  );
};
