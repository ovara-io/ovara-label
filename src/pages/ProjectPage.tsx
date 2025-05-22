import React, { useState } from "react";
import { useParams } from "wouter";
import { useOvaraStore } from "@/hooks/useOvaraStore";
import { useShallow } from "zustand/react/shallow";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { pickFolder } from "@/ipc-renderer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UpsertPoseClass } from "@/components/UpsertPoseClass";
import { UpsertDetectionClass } from "@/components/UpsertDetectionClass";
import { ImagePreviews } from "@/components/ImagePreviews";

export const ProjectPage = () => {
  const { id } = useParams<{ id: string }>();
  const [projects, updateProject] = useOvaraStore(
    useShallow((state) => [state.projects, state.updateProject]),
  );

  const project = projects.find((p) => p.id === id);
  const [imageDir, setImageDir] = useState(project?.imageDir ?? "");

  if (!project) {
    return <div className="p-4 text-red-500">Project not found.</div>;
  }

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

      {project.modelType === "pose" ? (
        <UpsertPoseClass project={project} onUpdate={updateProject} />
      ) : (
        <UpsertDetectionClass project={project} onUpdate={updateProject} />
      )}

      <Separator />
      <ImagePreviews projectId={project.id} imageDir={project.imageDir} />
    </div>
  );
};
