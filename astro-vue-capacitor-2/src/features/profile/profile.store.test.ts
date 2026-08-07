import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  $heightCm,
  $name,
  $weights,
  addWeight,
  latestWeight,
  removeWeight,
  setHeight,
  setName,
  updateWeight,
} from "./profile.store";

// Minimal in-memory localStorage — we don't rely on the test env providing one.
function fakeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => map.delete(k),
    setItem: (k, v) => map.set(k, v),
  };
}

let store: Storage;

beforeEach(() => {
  store = fakeStorage();
  vi.stubGlobal("localStorage", store);
  $weights.set([]);
  $heightCm.set(null);
  $name.set("");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("profile store", () => {
  it("appends weights kept sorted oldest-first", () => {
    addWeight(70, 2000);
    addWeight(72, 1000);
    expect($weights.get()).toEqual([
      { t: 1000, kg: 72 },
      { t: 2000, kg: 70 },
    ]);
  });

  it("latestWeight returns the most recent measurement by time", () => {
    addWeight(70, 2000);
    addWeight(72, 1000);
    expect(latestWeight()).toBe(70);
  });

  it("latestWeight is null with no measurements", () => {
    expect(latestWeight()).toBeNull();
  });

  it("updateWeight corrects the entry matched by timestamp", () => {
    addWeight(70, 1000);
    addWeight(72, 2000);
    updateWeight(2000, 71.5);
    expect($weights.get()).toEqual([
      { t: 1000, kg: 70 },
      { t: 2000, kg: 71.5 },
    ]);
    expect(store.getItem("rastro.weights")).toContain("71.5");
  });

  it("updateWeight ignores non-positive values", () => {
    addWeight(70, 1000);
    updateWeight(1000, 0);
    updateWeight(1000, -5);
    expect(latestWeight()).toBe(70);
  });

  it("removeWeight deletes the entry matched by timestamp", () => {
    addWeight(70, 1000);
    addWeight(72, 2000);
    removeWeight(1000);
    expect($weights.get()).toEqual([{ t: 2000, kg: 72 }]);
  });

  it("persists name to storage", () => {
    setName("Yahir");
    expect(store.getItem("rastro.name")).toBe("Yahir");
  });

  it("setHeight(null) removes the stored value", () => {
    setHeight(180);
    expect(store.getItem("rastro.heightCm")).toBe("180");
    setHeight(null);
    expect(store.getItem("rastro.heightCm")).toBeNull();
    expect($heightCm.get()).toBeNull();
  });
});
