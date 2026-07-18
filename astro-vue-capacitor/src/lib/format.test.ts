import { describe, expect, it } from "vitest";
import { fmtDistance, fmtPace, fmtTime, pad, paceSecPerKm, speedKmh } from "./format";

describe("fmtDistance", () => {
  it("shows whole meters below 1 km", () => {
    expect(fmtDistance(0)).toEqual({ value: "0", unit: "m" });
    expect(fmtDistance(850.4)).toEqual({ value: "850", unit: "m" });
    expect(fmtDistance(999)).toEqual({ value: "999", unit: "m" });
  });
  it("switches to km with 2 decimals at 1 km", () => {
    expect(fmtDistance(1000)).toEqual({ value: "1.00", unit: "km" });
    expect(fmtDistance(5230)).toEqual({ value: "5.23", unit: "km" });
  });
});

describe("pad", () => {
  it("zero-pads single digits", () => {
    expect(pad(0)).toBe("00");
    expect(pad(9)).toBe("09");
    expect(pad(10)).toBe("10");
  });
});

describe("fmtTime", () => {
  it("formats under a minute", () => {
    expect(fmtTime(0)).toBe("0:00");
    expect(fmtTime(5)).toBe("0:05");
  });
  it("formats minutes:seconds", () => {
    expect(fmtTime(65)).toBe("1:05");
    expect(fmtTime(600)).toBe("10:00");
  });
  it("formats hours:minutes:seconds", () => {
    expect(fmtTime(3661)).toBe("1:01:01");
  });
  it("floors fractional seconds", () => {
    expect(fmtTime(59.9)).toBe("0:59");
  });
});

describe("fmtPace", () => {
  it("returns an em dash for invalid paces", () => {
    expect(fmtPace(0)).toBe("—");
    expect(fmtPace(-5)).toBe("—");
    expect(fmtPace(Infinity)).toBe("—");
    expect(fmtPace(3601)).toBe("—");
  });
  it("formats normal paces", () => {
    expect(fmtPace(300)).toBe("5:00");
    expect(fmtPace(365)).toBe("6:05");
  });
  it("rolls seconds over to the next minute", () => {
    expect(fmtPace(359.9)).toBe("6:00");
  });
});

describe("paceSecPerKm / speedKmh", () => {
  it("computes pace and speed consistently", () => {
    // 1000 m in 300 s => 5:00 min/km and 12 km/h
    expect(paceSecPerKm(1000, 300)).toBe(300);
    expect(speedKmh(1000, 300)).toBeCloseTo(12, 5);
  });
  it("guards against zero distance/time", () => {
    expect(paceSecPerKm(0, 300)).toBe(0);
    expect(speedKmh(1000, 0)).toBe(0);
  });
});
