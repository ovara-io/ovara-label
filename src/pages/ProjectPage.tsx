import React, { useState } from "react";
import { useParams } from "wouter";
import { useOvaraStore } from "@/hooks/useOvaraStore";
import { useShallow } from "zustand/react/shallow";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { DetectionClass, PoseClass } from "@/classes";
import { nanoid } from "nanoid";
import { pickFolder } from "@/ipc-renderer";

export const ProjectPage = () => {
  const { id } = useParams<{ id: string }>();
  const [projects, updateProject] = useOvaraStore(
    useShallow((state) => [state.projects, state.updateProject]),
  );

  const project = projects.find((p) => p.id === id);
  const [imageDir, setImageDir] = useState(project?.imageDir ?? "");
  const [newClassName, setNewClassName] = useState("");
  const [newKeypoint, setNewKeypoint] = useState<string[]>([]);

  const handleAddClass = () => {
    if (!newClassName.trim()) return;

    const newClass =
      project.modelType === "pose"
        ? {
            id: nanoid(),
            name: newClassName,
            keypoints: [...newKeypoint],
          }
        : { id: nanoid(), name: newClassName };

    updateProject(project.id, {
      classes: [...project.classes, newClass] as PoseClass[] | DetectionClass[],
    });

    setNewClassName("");
    setNewKeypoint([]);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{project.name}</h1>
      <p className="text-muted-foreground">Model type: {project.modelType}</p>

      <Separator />

      <div className="space-y-4">
        <Label>Image Directory</Label>
        <div className="flex items-center gap-2">
          <Input
            className="flex-1"
            readOnly
            value={imageDir}
            placeholder="No folder selected"
          />
          <Button
            variant="outline"
            onClick={async () => {
              const path = await pickFolder();
              if (path) {
                setImageDir(path);
                updateProject(project.id, { imageDir: path });
              }
            }}
          >
            Pick Folder
          </Button>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <Label>New Class Name</Label>
        <Input
          value={newClassName}
          onChange={(e) => setNewClassName(e.target.value)}
        />

        {project.modelType === "pose" && (
          <div className="space-y-2">
            <Label>Keypoints (comma-separated)</Label>
            <Input
              placeholder="e.g. head,left_shoulder,right_shoulder"
              onChange={(e) =>
                setNewKeypoint(
                  e.target.value
                    .split(",")
                    .map((k) => k.trim())
                    .filter(Boolean),
                )
              }
            />
          </div>
        )}

        <Button onClick={handleAddClass}>Add Class</Button>
      </div>

      <Separator />

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Defined Classes</h2>
        {project.classes.map((c) => (
          <div key={c.id} className="rounded border p-2">
            <strong>{c.name}</strong>
            {project.modelType === "pose" && "keypoints" in c && (
              <div className="text-muted-foreground text-sm">
                Keypoints: {c.keypoints.join(", ")}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
