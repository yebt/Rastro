import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { $settingsPage, openSettingsPage } from "./settings.nav";
import SettingsRoot from "./SettingsRoot.vue";

describe("SettingsRoot", () => {
  it("resets to the menu when re-entered (mounted)", () => {
    // Simulate having left a sub-page open, then coming back to the tab.
    openSettingsPage("profile");
    mount(SettingsRoot);
    expect($settingsPage.get()).toBeNull();
  });
});
