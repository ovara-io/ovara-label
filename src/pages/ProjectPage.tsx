import React, { useState } from "react";
import { useParams } from "wouter";
import { useProjectStore } from "@/hooks/useProjectStore";
import { useShallow } from "zustand/react/shallow";
import { Separator } from "@/components/ui/separator";
import { pickFolder } from "@/ipc-renderer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UpsertPoseClass } from "@/components/UpsertPoseClass";
import { UpsertDetectionClass } from "@/components/UpsertDetectionClass";
import { ImagePreviews } from "@/components/ImagePreviews";

export const ProjectPage = () => {
  const { id } = useParams<{ id: string }>();

  const [projects, updateProjectImageDir] = useProjectStore(
    useShallow((state) => [state.projects, state.updateProjectImageDir]),
  );

  const project = projects.find((p) => p.id === id);
  const [imageDir, setImageDir] = useState(project?.imageDir ?? "");

  if (!project) return null;

  const handleUpdateImageDir = async () => {
    const path = await pickFolder();
    if (path) {
      setImageDir(path);
      updateProjectImageDir(project.id, path);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">{project.name}</h1>
      <p className="text-muted-foreground">Model type: {project.modelType}</p>

      <Separator />

      <div className="space-y-4">
        <h2 className={"text-xl"}>Image Directory</h2>
        <div className="flex items-center gap-2">
          <Input
            className="flex-1"
            readOnly
            value={imageDir}
            placeholder="No folder selected"
          />
          <Button variant="outline" onClick={handleUpdateImageDir}>
            Pick Folder
          </Button>
        </div>
      </div>

      <Separator />

      {project.modelType === "pose" ? (
        <UpsertPoseClass project={project} />
      ) : (
        <UpsertDetectionClass project={project} />
      )}
      <Separator />

      <ImagePreviews projectId={project.id} imageDir={project.imageDir} />
    </div>
  );
};
