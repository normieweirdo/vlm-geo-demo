export type ListDirection = "up" | "down";

export function clampListIndex(index: number, length: number) {
  if (length <= 0) return -1;
  return Math.min(Math.max(index, 0), length - 1);
}

export function getNextListIndex(currentIndex: number, direction: ListDirection, length: number) {
  if (length <= 0) return -1;
  if (currentIndex === -1) return direction === "down" ? 0 : length - 1;
  const step = direction === "down" ? 1 : -1;
  return (clampListIndex(currentIndex, length) + step + length) % length;
}
