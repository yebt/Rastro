/**
 * Android hardware back button.
 *
 * Without this, back exits the app from anywhere. The handler walks a clear
 * priority chain instead: unwind the setup wizard, then a settings sub-page,
 * then return to Home, and only leave the app from the Home root.
 */

import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { closeSettingsPage, $settingsPage } from "../settings/settings.nav";
import { $setupDone, prevStep } from "../setup/setup.store";
import { $activeTab, setTab } from "./nav.store";

export function handleBack(): void {
  // 1) First-run wizard: step back; from the first step, leave the app.
  if (!$setupDone.get()) {
    if (!prevStep()) void App.minimizeApp();
    return;
  }
  // 2) Inside a settings sub-page: return to the menu.
  if ($settingsPage.get() !== null) {
    closeSettingsPage();
    return;
  }
  // 3) Not on Home: go Home first.
  if ($activeTab.get() !== "home") {
    setTab("home");
    return;
  }
  // 4) Home root: leave the app.
  void App.minimizeApp();
}

/** Register the back handler on native; returns a cleanup fn. No-op on web. */
export function registerBackButton(): () => void {
  if (!Capacitor.isNativePlatform()) return () => {};
  const handle = App.addListener("backButton", handleBack);
  return () => {
    void handle.then((h) => h.remove());
  };
}
