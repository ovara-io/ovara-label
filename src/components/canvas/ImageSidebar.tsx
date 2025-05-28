import React from "react";
import { useImagePageStore } from "@/hooks/useImagePageStore";
import { cn } from "@/lib/utils";
import {
  Annotation,
  DetectionAnnotation,
  DetectionClass,
  Visibility,
  PoseAnnotation,
  PoseClass,
  Project,
} from "@/classes";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
} from "../ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { BookOpen, Bot, ChevronRight } from "lucide-react";

interface PlacedClassProps {
  project: Project;
  cls: DetectionClass;
  ann: DetectionAnnotation;
}

const PlacedClass = ({ project, cls, ann }: PlacedClassProps) => {
  return (
    <SidebarMenuSub key={cls.id}>
      <SidebarMenuSubButton className={"h-full py-1"}>
        <SidebarMenuSubItem>
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 border"
              style={{ backgroundColor: ann.color }}
            />
            <span>{cls.name}</span>
          </div>
          {project.modelType === "pose" && (
            <ul className="text-muted-foreground ml-4.75 list-disc text-xs">
              {(cls as PoseClass).keypoints.map((kp) => {
                const match = (ann as PoseAnnotation).keypoints.find(
                  (k) =>
                    k.id === kp.id && k.visible === Visibility.LabeledVisible,
                );
                if (!match) return null;
                return <li key={kp.id}>{kp.name}</li>;
              })}
            </ul>
          )}
        </SidebarMenuSubItem>
      </SidebarMenuSubButton>
    </SidebarMenuSub>
  );
};

interface SidebarProps {
  project: Project;
  imagePath: string;
}

export const ImageSidebar: React.FC<SidebarProps> = ({
  project,
  imagePath,
}) => {
  const selectedClassId = useImagePageStore((s) => s.selectedClassId);
  const setSelectedClassId = useImagePageStore((s) => s.setSelectedClassId);
  const [, navigate] = useLocation();

  const annotations: Annotation[] = project?.annotations?.[imagePath] ?? [];

  const index = project.imagePaths.findIndex((p) => p === imagePath);
  const hasPrev = index > 0;
  const hasNext = index < project.imagePaths.length - 1;

  return (
    <SidebarProvider className={"w-64"}>
      <Sidebar collapsible={"none"}>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <Collapsible
                asChild
                defaultOpen={true}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={"classes"}>
                      <BookOpen />
                      <span>Select Class</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent className={"space-y-1"}>
                    {project.classes.map((cls) => {
                      const isSelected = cls.id === selectedClassId;
                      const count = annotations.filter(
                        (a) => a.classId === cls.id,
                      ).length;

                      return (
                        <SidebarMenuSub
                          key={cls.id}
                          className={cn(
                            "cursor-pointer",
                            isSelected && "border-primary",
                          )}
                          onClick={() => {
                            if (
                              project.modelType === "pose" &&
                              "keypoints" in cls &&
                              cls.keypoints.length === 0
                            ) {
                              return;
                            }
                            setSelectedClassId(cls.id);
                          }}
                        >
                          <SidebarMenuSubButton className={"h-full py-1"}>
                            <SidebarMenuSubItem>
                              {cls.name} ({count})
                              {project.modelType === "pose" &&
                                "keypoints" in cls && (
                                  <ul className="text-muted-foreground ml-4 list-disc text-xs">
                                    {cls.keypoints.map((kp) => (
                                      <li key={kp.id}>{kp.name}</li>
                                    ))}
                                  </ul>
                                )}
                            </SidebarMenuSubItem>
                          </SidebarMenuSubButton>
                        </SidebarMenuSub>
                      );
                    })}
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <Collapsible
                asChild
                defaultOpen={false}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={"classes"}>
                      <Bot />
                      <span>Annotations</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent className={"space-y-1"}>
                    {annotations.map((ann, idx) => {
                      const cls = project.classes.find(
                        (c) => c.id === ann.classId,
                      );
                      return (
                        <PlacedClass
                          key={idx}
                          project={project}
                          cls={cls}
                          ann={ann}
                        />
                      );
                    })}
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="flex-row justify-between">
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
          <Popover>
            <PopoverTrigger asChild>
              <Button className="p-1 text-sm font-normal" variant={"outline"}>
                {index + 1} / {project.imagePaths.length}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="center" side="top">
              <Slider
                min={1}
                max={project.imagePaths.length}
                value={[index + 1]}
                onValueChange={([val]) =>
                  navigate(`/project/${project.id}/image/${val - 1}`, {
                    replace: true,
                  })
                }
              />
            </PopoverContent>
          </Popover>
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
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
};
