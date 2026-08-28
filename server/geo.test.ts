import { describe, expect, it } from "vitest";
import { bboxStyle, clampNormalizedBBox } from "../shared/geo";

describe("normalized geospatial bounding boxes", () => {
  it("clips coordinates to the normalized 0–1 range and orders corners", () => {
    expect(clampNormalizedBBox([1.2, 0.8, -0.2, 0.1])).toEqual([0, 0.1, 1, 0.8]);
  });

  it("converts normalized geometry to percentage positioning for rendered images", () => {
    expect(bboxStyle([0.1, 0.2, 0.6, 0.8])).toEqual({
      left: "10%",
      top: "20%",
      width: "50%",
      height: "60%",
    });
  });
});
