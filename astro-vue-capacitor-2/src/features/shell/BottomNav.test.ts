import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import BottomNav from "./BottomNav.vue";
import { $activeTab } from "./nav.store";

describe("BottomNav", () => {
  beforeEach(() => {
    $activeTab.set("home");
  });

  it("renders one button per tab", () => {
    const wrapper = mount(BottomNav);
    expect(wrapper.findAll("button.tab")).toHaveLength(4);
  });

  it("marks the active tab and updates the store on click", async () => {
    const wrapper = mount(BottomNav);
    const [, workout] = wrapper.findAll("button.tab");

    expect(wrapper.find("button.tab.on").text()).toContain("Inicio");

    await workout!.trigger("click");
    expect($activeTab.get()).toBe("workout");
  });
});
