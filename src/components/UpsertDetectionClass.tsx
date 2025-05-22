import React, { useState } from "react";
import { DetectionClass, DetectionProject } from "@/classes";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { nanoid } from "nanoid";

interface Props {
  project: DetectionProject;
  onUpdate: (id: string, patch: Partial<DetectionProject>) => void;
}

export const UpsertDetectionClass = ({ project, onUpdate }: Props) => {
  const [newClassName, setNewClassName] = useState("");

  const handleAddClass = () => {
    if (!newClassName.trim()) return;

    const newClass: DetectionClass = {
      id: nanoid(),
      name: newClassName,
    };

    onUpdate(project.id, { classes: [...project.classes, newClass] });
    setNewClassName("");
  };

  const handleDeleteClass = (classId: string) => {
    onUpdate(project.id, {
      classes: project.classes.filter((c) => c.id !== classId),
    });
  };

  return (
    <div className="space-y-4">
      <Label>New Class Name</Label>
      <Input
        value={newClassName}
        onChange={(e) => setNewClassName(e.target.value)}
      />
      <Button onClick={handleAddClass}>Add Class</Button>

      <Separator />

      <h2 className="text-lg font-semibold">Defined Classes</h2>
      {project.classes.map((c) => (
        <div key={c.id} className="flex justify-between rounded border p-3">
          <strong>{c.name}</strong>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDeleteClass(c.id)}
          >
            −
          </Button>
        </div>
      ))}
    </div>
  );
};
