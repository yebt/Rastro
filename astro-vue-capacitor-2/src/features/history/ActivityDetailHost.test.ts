import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { afterEach, describe, expect, it } from "vitest";
import { type MoveActivity, startMove } from "../tracking";
import ActivityDetailHost from "./ActivityDetailHost.vue";
import { $openActivityId, closeActivity, openActivity } from "./detail.store";
import { $activities, $loaded } from "./history.store";

function done(id: string): MoveActivity {
  return { ...startMove("walk", 1_000), id, endedAt: 2_000 };
}

const stubs = { ActivityDetail: { template: "<div class='detail-stub' />" } };

afterEach(() => {
  closeActivity();
  $activities.set([]);
});

describe("ActivityDetailHost", () => {
  it("closes when the open activity is deleted (no blank overlay)", async () => {
    $activities.set([done("a"), done("b")]);
    $loaded.set(true);
    openActivity("a");
    const w = mount(ActivityDetailHost, { global: { stubs } });
    await nextTick();
    expect(w.find(".detail-stub").exists()).toBe(true);

    $activities.set([done("b")]); // what deleteActivity() leaves behind
    await nextTick();
    await nextTick();
    expect($openActivityId.get()).toBeNull();
    expect(w.find(".detail-host").exists()).toBe(false);
  });

  it("keeps a different detail open when an unrelated record changes", async () => {
    $activities.set([done("a"), done("b")]);
    $loaded.set(true);
    openActivity("a");
    mount(ActivityDetailHost, { global: { stubs } });
    await nextTick();
    $activities.set([done("a")]);
    await nextTick();
    await nextTick();
    expect($openActivityId.get()).toBe("a");
  });
});
