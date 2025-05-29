// Normalizes a value from [0, size] → [0, 1]
export function norm(value: number, size: number): number {
  return value / size;
}

// Denormalizes a value from [0, 1] → [0, size]
export function denorm(value: number, size: number): number {
  return value * size;
}

// Projects image-space coordinates into screen-space, using viewport and render size
export function imageToScreen(
  x: number,
  y: number,
  renderSize: { width: number; height: number }, // renamed from containerSize
  viewport: { x: number; y: number; width: number; height: number } | null,
): [number, number] {
  if (!viewport) return [x, y];
  const scaleX = renderSize.width / viewport.width;
  const scaleY = renderSize.height / viewport.height;
  return [(x - viewport.x) * scaleX, (y - viewport.y) * scaleY];
}

// Unprojects screen-space coordinates into image-space, using viewport and render size
export function screenToImage(
  screenX: number,
  screenY: number,
  renderSize: { width: number; height: number }, // renamed from containerSize
  viewport: { x: number; y: number; width: number; height: number } | null,
): [number, number] {
  if (!viewport) return [screenX, screenY];
  const scaleX = renderSize.width / viewport.width;
  const scaleY = renderSize.height / viewport.height;
  return [screenX / scaleX + viewport.x, screenY / scaleY + viewport.y];
}
