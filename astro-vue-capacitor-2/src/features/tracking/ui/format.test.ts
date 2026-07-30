import { describe, expect, it } from "vitest";
import { distanceParts, formatDuration, formatPace, formatSpeed } from "./format";

describe("tracking formatters", () => {
  it("duration is M:SS under an hour, H:MM:SS above", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(9000)).toBe("0:09");
    expect(formatDuration(75_000)).toBe("1:15");
    expect(formatDuration(3_723_000)).toBe("1:02:03");
  });

  it("duration never goes negative", () => {
    expect(formatDuration(-500)).toBe("0:00");
  });

  it("distance is metres under a km, km with two decimals above", () => {
    expect(distanceParts(820)).toEqual({ value: "820", unit: "m" });
    expect(distanceParts(999)).toEqual({ value: "999", unit: "m" });
    expect(distanceParts(1000)).toEqual({ value: "1.00", unit: "km" });
    expect(distanceParts(3420)).toEqual({ value: "3.42", unit: "km" });
  });

  it("pace is M'SS\", or an em dash when absent", () => {
    expect(formatPace(321)).toBe("5'21\"");
    expect(formatPace(60)).toBe("1'00\"");
    expect(formatPace(null)).toBe("—");
    expect(formatPace(0)).toBe("—");
  });

  it("speed is km/h with one decimal", () => {
    expect(formatSpeed(2.5)).toBe("9.0");
    expect(formatSpeed(0)).toBe("0.0");
  });
});
