import { beforeEach, describe, expect, it, vi } from "vitest";
import { $theme, applyTheme, setTheme } from "./settings.store";

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
  document.documentElement.removeAttribute("data-theme");
  $theme.set("auto");
});

describe("settings store — theme", () => {
  it("forcing a theme stamps data-theme on <html>", () => {
    setTheme("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect($theme.get()).toBe("dark");
  });

  it("auto removes the attribute so the OS preference rules", () => {
    setTheme("light");
    setTheme("auto");
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("applyTheme reflects the current store value", () => {
    $theme.set("dark");
    applyTheme();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });
});
