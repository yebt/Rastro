import { beforeEach, describe, expect, it, vi } from "vitest";
import { activityRepository, startMove } from "../tracking";
import { $draft, checkForDraft, discardDraft } from "./recovery.store";

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

const draft = () => ({ ...startMove("jog", 1000), id: "d1" });

beforeEach(async () => {
  vi.stubGlobal("localStorage", fakeStorage());
  await activityRepository().clear();
  $draft.set(null);
});

describe("checkForDraft", () => {
  it("first launch of this version: scans once and remembers the id", async () => {
    await activityRepository().save(draft());
    await checkForDraft();
    expect($draft.get()?.id).toBe("d1");
    expect(localStorage.getItem("rastro.draftId")).toBe("d1");
  });

  it("with a known id it fetches just that record (no full scan)", async () => {
    await activityRepository().save(draft());
    localStorage.setItem("rastro.draftId", "d1");
    const list = vi.spyOn(activityRepository(), "list");
    await checkForDraft();
    expect($draft.get()?.id).toBe("d1");
    expect(list).not.toHaveBeenCalled();
    list.mockRestore();
  });

  it("'' means no draft: nothing is read", async () => {
    localStorage.setItem("rastro.draftId", "");
    const get = vi.spyOn(activityRepository(), "get");
    const list = vi.spyOn(activityRepository(), "list");
    await checkForDraft();
    expect($draft.get()).toBeNull();
    expect(get).not.toHaveBeenCalled();
    expect(list).not.toHaveBeenCalled();
  });

  it("discarding clears the remembered id", async () => {
    await activityRepository().save(draft());
    await checkForDraft();
    await discardDraft();
    expect(localStorage.getItem("rastro.draftId")).toBe("");
  });
});
