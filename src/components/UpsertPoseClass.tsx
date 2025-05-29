import React, { useState } from "react";
import { PoseClass, PoseProject, Keypoint } from "@/classes";
import { nanoid } from "nanoid";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useProjectStore } from "@/hooks/useProjectStore";
import { useShallow } from "zustand/react/shallow";

interface Props {
  project: PoseProject;
}

export const UpsertPoseClass = ({ project }: Props) => {
  const [addPoseClass, deletePoseClass, addPoseKeypoint, deletePoseKeypoint] =
    useProjectStore(
      useShallow((s) => [
        s.addPoseClass,
        s.deletePoseClass,
        s.addPoseKeypoint,
        s.deletePoseKeypoint,
      ]),
    );

  const [newClassName, setNewClassName] = useState("");
  const [newKeypoints, setNewKeypoints] = useState<Record<string, string>>({});

  const handleAddClass = () => {
    if (!newClassName.trim()) return;
    const newClass: PoseClass = {
      id: nanoid(),
      name: newClassName,
      keypoints: [],
    };
    addPoseClass(project.id, newClass);
    setNewClassName("");
  };

  const handleDeleteClass = (classId: string) => {
    deletePoseClass(project.id, classId);
  };

  const handleAddKeypoint = (classId: string) => {
    const name = newKeypoints[classId]?.trim();
    if (!name) return;
    const newKeypoint: Keypoint = { id: nanoid(), name };
    addPoseKeypoint(project.id, classId, newKeypoint);
    setNewKeypoints((prev) => ({ ...prev, [classId]: "" }));
  };

  const handleDeleteKeypoint = (classId: string, keypointId: string) => {
    deletePoseKeypoint(project.id, classId, keypointId);
  };

  return (
    <div className="space-y-4">
      <h2 className={"text-xl"}>New Class</h2>
      <Input
        value={newClassName}
        onChange={(e) => setNewClassName(e.target.value)}
      />
      <p className="text-muted-foreground text-sm">
        Keypoints to be defined after creating the class.
      </p>
      <Button onClick={handleAddClass}>Add Class</Button>

      <Separator />

      <h2 className="text-xl">Classes</h2>
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
              <li key={kpt.id} className="flex items-center justify-between">
                <span>{kpt.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteKeypoint(c.id, kpt.id)}
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
