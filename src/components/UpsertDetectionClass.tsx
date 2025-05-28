import React, { useState } from "react";
import { DetectionClass, DetectionProject } from "@/classes";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { nanoid } from "nanoid";
import { useProjectStore } from "@/hooks/useProjectStore";
import { useShallow } from "zustand/react/shallow";

interface Props {
  project: DetectionProject;
}

export const UpsertDetectionClass = ({ project }: Props) => {
  const [newClassName, setNewClassName] = useState("");

  const [addDetectionClass, deleteDetectionClass] = useProjectStore(
    useShallow((s) => [s.addDetectionClass, s.deleteDetectionClass]),
  );

  const handleAddClass = () => {
    if (!newClassName.trim()) return;
    const newClass: DetectionClass = {
      id: nanoid(),
      name: newClassName,
    };
    addDetectionClass(project.id, newClass);
    setNewClassName("");
  };

  const handleDeleteClass = (classId: string) => {
    deleteDetectionClass(project.id, classId);
  };

  return (
    <div className="space-y-4">
      <h2 className={"text-xl"}>New Class Name</h2>
      <Input
        value={newClassName}
        onChange={(e) => setNewClassName(e.target.value)}
      />
      <Button onClick={handleAddClass}>Add Class</Button>

      <Separator />

      <h2 className="text-xl">Defined Classes</h2>
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
