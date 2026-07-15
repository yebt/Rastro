import "fake-indexeddb/auto"; // oxlint-disable-line import/no-unassigned-import -- side-effect polyfill
import { beforeEach, describe, expect, it } from "vitest";
import type { GpsActivity } from "../lib/types";
import { IndexedDBAdapter } from "./indexeddb";

const gps = (id: string): GpsActivity => ({
  id,
  kind: "gps",
  type: "Caminata",
  date: 1_720_000_000_000,
  distance: 1234,
  duration: 600,
  route: [[4.65, -74.08]],
});

describe("IndexedDBAdapter", () => {
  let repo: IndexedDBAdapter;

  beforeEach(async () => {
    repo = new IndexedDBAdapter();
    await repo.clear();
  });

  it("adds and reads back", async () => {
    await repo.add(gps("a1"));
    const all = await repo.all();
    expect(all).toHaveLength(1);
    expect(all[0]?.id).toBe("a1");
  });

  it("overwrites on same id (put semantics)", async () => {
    await repo.add(gps("a1"));
    await repo.add({ ...gps("a1"), distance: 9999 });
    const all = await repo.all();
    expect(all).toHaveLength(1);
    expect((all[0] as { distance: number }).distance).toBe(9999);
  });

  it("removes by id", async () => {
    await repo.add(gps("a1"));
    await repo.remove("a1");
    expect(await repo.all()).toHaveLength(0);
  });

  it("replaceAll swaps the whole collection", async () => {
    await repo.add(gps("a1"));
    await repo.replaceAll([gps("b1"), gps("b2")]);
    const ids = (await repo.all()).map((a) => a.id).toSorted();
    expect(ids).toEqual(["b1", "b2"]);
  });
});
