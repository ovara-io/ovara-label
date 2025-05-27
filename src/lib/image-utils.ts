export function norm(
  value: number,
  axis: "x" | "y",
  renderSize: { width: number; height: number },
): number {
  return axis === "x" ? value / renderSize.width : value / renderSize.height;
}

export function denorm(
  value: number,
  axis: "x" | "y",
  renderSize: { width: number; height: number },
): number {
  return axis === "x" ? value * renderSize.width : value * renderSize.height;
}
