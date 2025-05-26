export function norm(
  value: number,
  axis: "x" | "y",
  stageSize: { width: number; height: number },
): number {
  return axis === "x" ? value / stageSize.width : value / stageSize.height;
}

export function denorm(
  value: number,
  axis: "x" | "y",
  stageSize: { width: number; height: number },
): number {
  return axis === "x" ? value * stageSize.width : value * stageSize.height;
}
