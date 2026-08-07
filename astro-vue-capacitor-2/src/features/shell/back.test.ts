import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@capacitor/app", () => ({
  App: { minimizeApp: vi.fn(), addListener: vi.fn() },
}));

import { App } from "@capacitor/app";
import { $settingsPage, openSettingsPage } from "../settings/settings.nav";
import { $setupDone, $setupStep } from "../setup/setup.store";
import { handleBack } from "./back";
import { $activeTab, setTab } from "./nav.store";

const minimize = vi.mocked(App.minimizeApp);

beforeEach(() => {
  $setupDone.set(true);
  $setupStep.set(0);
  $settingsPage.set(null);
  $activeTab.set("home");
  minimize.mockClear();
});

describe("handleBack priority chain", () => {
  it("steps the wizard back during setup", () => {
    $setupDone.set(false);
    $setupStep.set(2);
    handleBack();
    expect($setupStep.get()).toBe(1);
    expect(minimize).not.toHaveBeenCalled();
  });

  it("leaves the app from the first setup step", () => {
    $setupDone.set(false);
    $setupStep.set(0);
    handleBack();
    expect(minimize).toHaveBeenCalledOnce();
  });

  it("returns from a settings page to the menu", () => {
    openSettingsPage("profile");
    handleBack();
    expect($settingsPage.get()).toBeNull();
  });

  it("goes Home from another tab", () => {
    setTab("profile");
    handleBack();
    expect($activeTab.get()).toBe("home");
  });

  it("leaves the app from the Home root", () => {
    handleBack();
    expect(minimize).toHaveBeenCalledOnce();
  });
});
