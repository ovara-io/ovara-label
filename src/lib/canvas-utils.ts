export function norm(value: number, size: number): number {
  return value / size;
}

export function denorm(value: number, size: number): number {
  return value * size;
}
