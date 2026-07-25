import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  $heightCm,
  $name,
  $weights,
  addWeight,
  latestWeight,
  setHeight,
  setName,
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
