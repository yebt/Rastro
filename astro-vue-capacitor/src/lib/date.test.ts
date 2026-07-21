import { describe, expect, it } from "vitest";
import { backupStamp, dayKey } from "./date";

// Built with the local Date constructor so assertions hold regardless of TZ.
const TS = new Date(2024, 4, 13, 9, 5, 7).getTime(); // 13 May 2024, 09:05:07

describe("dayKey", () => {
  it("formats the local calendar day", () => {
    expect(dayKey(TS)).toBe("2024-05-13");
  });
});

describe("backupStamp", () => {
  it("appends a zero-padded, sortable time", () => {
    expect(backupStamp(TS)).toBe("2024-05-13_090507");
  });
  it("orders chronologically as plain strings", () => {
    const later = new Date(2024, 4, 13, 9, 5, 8).getTime();
    expect(backupStamp(TS) < backupStamp(later)).toBe(true);
  });
});
