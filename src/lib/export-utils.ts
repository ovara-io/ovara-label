import { writeFile } from "@/ipc-renderer";
import { PoseAnnotation, Project, KeypointVisibility } from "@/classes";

export async function exportYoloLabels(project: Project): Promise<void> {
  const imageDir = project.imageDir;
  const classNames = project.classes.map((cls) => cls.name);
  const classMap = new Map(project.classes.map((cls, idx) => [cls.id, idx]));
  const keypoints =
    project.modelType === "pose"
      ? project.classes.flatMap((cls) => cls.keypoints.map((kp) => kp.id))
      : [];

  const annotations = project.annotations;

  // Filter only labelled image paths
  const labelledPaths = project.imagePaths.filter(
    (path) => (annotations[path]?.length ?? 0) > 0,
  );

  for (const imagePath of labelledPaths) {
    const anns = annotations[imagePath];
    if (!anns || anns.length === 0) continue;

    const fileName = imagePath
      .split("/")
      .pop()
      ?.replace(/\.[^.]+$/, ".txt");
    if (!fileName) continue;

    const lines: string[] = [];

    for (const ann of anns) {
      const classIdx = classMap.get(ann.classId);
      if (classIdx === undefined) continue;

      const [x, y, w, h] = ann.bbox;
      const cx = x + w / 2;
      const cy = y + h / 2;

      if (project.modelType === "detection") {
        lines.push(`${classIdx} ${cx} ${cy} ${w} ${h}`);
      } else if (project.modelType === "pose") {
        const poseAnn = ann as PoseAnnotation;
        const kptMap = new Map(poseAnn.keypoints.map((kp) => [kp.id, kp]));
        const fullKeypoints = keypoints.map((kpId) => {
          const kp = kptMap.get(kpId);
          return kp && kp.visible === KeypointVisibility.LabeledVisible
            ? `${kp.x} ${kp.y} ${kp.visible}`
            : `0 0 0`;
        });
        lines.push(
          `${classIdx} ${cx} ${cy} ${w} ${h} ${fullKeypoints.join(" ")}`,
        );
      }
    }

    await writeFile(`${imageDir}/${fileName}`, lines.join("\n"));
  }

  await writeFile(
    `${imageDir}/classes.txt`,
    classNames.map((name) => name.trim()).join("\n"),
  );
}
