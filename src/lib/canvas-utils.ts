// Normalizes a value from [0, size] → [0, 1]
export function norm(value: number, size: number): number {
  return value / size;
}

// Denormalizes a value from [0, 1] → [0, size]
export function denorm(value: number, size: number): number {
  return value * size;
}

// Projects image-space coordinates into screen-space, using viewport and container size
export function imageToScreen(
  x: number,
  y: number,
  containerSize: { width: number; height: number },
  viewport: { x: number; y: number; width: number; height: number } | null,
): [number, number] {
  if (!viewport) return [x, y];
  const scaleX = containerSize.width / viewport.width;
  const scaleY = containerSize.height / viewport.height;
  return [(x - viewport.x) * scaleX, (y - viewport.y) * scaleY];
}

// Unprojects screen-space coordinates into image-space, using viewport and container size
export function screenToImage(
  screenX: number,
  screenY: number,
  containerSize: { width: number; height: number },
  viewport: { x: number; y: number; width: number; height: number } | null,
): [number, number] {
  if (!viewport) return [screenX, screenY];
  const scaleX = containerSize.width / viewport.width;
  const scaleY = containerSize.height / viewport.height;
  return [screenX / scaleX + viewport.x, screenY / scaleY + viewport.y];
}
