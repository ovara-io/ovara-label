import React, { useState } from "react";
import { PoseClass, PoseProject } from "@/classes";
import { nanoid } from "nanoid";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";

interface Props {
  project: PoseProject;
  onUpdate: (id: string, patch: Partial<PoseProject>) => void;
}

export const UpsertPoseClass = ({ project, onUpdate }: Props) => {
  const [newClassName, setNewClassName] = useState("");
  const [newKeypoints, setNewKeypoints] = useState<Record<string, string>>({});

  const handleAddClass = () => {
    if (!newClassName.trim()) return;

    const newClass: PoseClass = {
      id: nanoid(),
      name: newClassName,
      keypoints: [],
    };

    onUpdate(project.id, { classes: [...project.classes, newClass] });
    setNewClassName("");
  };

  const handleDeleteClass = (classId: string) => {
    onUpdate(project.id, {
      classes: project.classes.filter((c) => c.id !== classId),
    });
  };

  const handleAddKeypoint = (classId: string) => {
    const keypoint = newKeypoints[classId]?.trim();
    if (!keypoint) return;

    const updatedClasses = project.classes.map((c) =>
      c.id === classId ? { ...c, keypoints: [...c.keypoints, keypoint] } : c,
    );

    onUpdate(project.id, { classes: updatedClasses });
    setNewKeypoints((prev) => ({ ...prev, [classId]: "" }));
  };

  const handleDeleteKeypoint = (classId: string, keypoint: string) => {
    const updatedClasses = project.classes.map((c) =>
      c.id === classId
        ? { ...c, keypoints: c.keypoints.filter((k) => k !== keypoint) }
        : c,
    );

    onUpdate(project.id, { classes: updatedClasses });
  };

  return (
    <div className="space-y-4">
      <Label>New Class Name</Label>
      <Input
        value={newClassName}
        onChange={(e) => setNewClassName(e.target.value)}
      />
      <p className="text-muted-foreground text-sm">
        Keypoints will be defined after creating the class.
      </p>
      <Button onClick={handleAddClass}>Add Class</Button>

      <Separator />

      <h2 className="text-lg font-semibold">Defined Classes</h2>
      {project.classes.map((c) => (
        <div key={c.id} className="space-y-2 rounded border p-3">
          <div className="flex items-center justify-between">
            <strong>{c.name}</strong>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDeleteClass(c.id)}
            >
              −
            </Button>
          </div>

          <ul className="text-muted-foreground space-y-1 text-sm">
            {c.keypoints.map((kpt) => (
              <li key={kpt} className="flex items-center justify-between">
                <span>{kpt}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteKeypoint(c.id, kpt)}
                >
                  −
                </Button>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <Input
              className="flex-1"
              placeholder="New keypoint"
              value={newKeypoints[c.id] ?? ""}
              onChange={(e) =>
                setNewKeypoints((prev) => ({
                  ...prev,
                  [c.id]: e.target.value,
                }))
              }
            />
            <Button
              size="sm"
              onClick={() => handleAddKeypoint(c.id)}
              disabled={!newKeypoints[c.id]?.trim()}
            >
              +
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
