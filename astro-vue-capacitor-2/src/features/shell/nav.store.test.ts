import { beforeEach, describe, expect, it } from "vitest";
import { $activeTab, setTab, TABS } from "./nav.store";

describe("nav.store", () => {
  beforeEach(() => {
    $activeTab.set("home");
  });

  it("starts on home", () => {
    expect($activeTab.get()).toBe("home");
  });

  it("setTab switches the active tab", () => {
    setTab("profile");
    expect($activeTab.get()).toBe("profile");
  });

  it("exposes the four tabs in order", () => {
    expect(TABS.map((t) => t.id)).toEqual(["home", "workout", "profile", "more"]);
  });
});
