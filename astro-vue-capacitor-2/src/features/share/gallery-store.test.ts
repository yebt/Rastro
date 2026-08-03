import { describe, expect, it } from "vitest";
import { shareGallery } from "./gallery-store";

function rec(activityId: string, createdAt: number) {
  return { activityId, themeKey: "clasico:noche", dataUrl: "data:,x", createdAt };
}

// The store picks its in-memory engine when IndexedDB is absent (the case under
// happy-dom). If a real IDB is present we skip — that path is exercised on device.
describe.skipIf(typeof indexedDB !== "undefined")("shareGallery (memory)", () => {
  it("adds records and lists them newest-first with generated ids", async () => {
    const g = shareGallery();
    const a = await g.add(rec("act-1", 100));
    const b = await g.add(rec("act-2", 200));

    expect(a.id).toBeTruthy();
    expect(b.id).not.toBe(a.id);

    const list = await g.list();
    expect(list.map((r) => r.activityId)).toEqual(["act-2", "act-1"]);
  });

  it("removes a record by id", async () => {
    const g = shareGallery();
    const before = (await g.list()).length;
    const r = await g.add(rec("act-3", 300));
    await g.remove(r.id);
    expect((await g.list()).length).toBe(before);
  });
});
