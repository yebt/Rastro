import { beforeEach, describe, expect, it, vi } from "vitest";
import { mapStyleFor } from "../features/share/route-map";
import { $basemap, DEFAULT_BASEMAP, setBasemap, VECTOR_STYLE } from "./basemap";

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

beforeEach(() => {
  vi.stubGlobal("localStorage", fakeStorage());
  $basemap.set(DEFAULT_BASEMAP);
});

describe("basemap setting", () => {
  it("defaults to the vector basemap", () => {
    expect(DEFAULT_BASEMAP).toBe("vector");
  });

  it("persists the chosen provider", () => {
    setBasemap("esri");
    expect($basemap.get()).toBe("esri");
    expect(localStorage.getItem("rastro.basemap")).toBe("esri");
  });
});

describe("share map styles follow the setting", () => {
  it("road styles use the OpenFreeMap style URLs when vector", () => {
    expect(mapStyleFor("light")).toBe(VECTOR_STYLE.light);
    expect(mapStyleFor("dark")).toBe(VECTOR_STYLE.dark);
    expect(mapStyleFor("voyager")).toBe(VECTOR_STYLE.color);
  });

  it("road styles fall back to Esri raster when esri", () => {
    setBasemap("esri");
    const style = mapStyleFor("light");
    expect(typeof style).toBe("object");
    expect(JSON.stringify(style)).toContain("World_Light_Gray_Base");
  });

  it("topo / satellite / streets stay raster regardless", () => {
    for (const id of ["topo", "satellite", "streets"] as const) {
      expect(typeof mapStyleFor(id)).toBe("object");
    }
  });
});
