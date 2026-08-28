export type NormalizedBBox = [number, number, number, number];

export function clampNormalizedBBox(box: NormalizedBBox): NormalizedBBox {
  const values = box.map((value) => Math.min(1, Math.max(0, value))) as NormalizedBBox;
  return [
    Math.min(values[0], values[2]),
    Math.min(values[1], values[3]),
    Math.max(values[0], values[2]),
    Math.max(values[1], values[3]),
  ];
}

export function bboxStyle(box: NormalizedBBox) {
  const [xMin, yMin, xMax, yMax] = clampNormalizedBBox(box);
  const percent = (value: number) => `${Number((value * 100).toFixed(4))}%`;
  return {
    left: percent(xMin),
    top: percent(yMin),
    width: percent(xMax - xMin),
    height: percent(yMax - yMin),
  };
}
