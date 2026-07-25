import { describe, expect, it, vi } from "vitest";
import { toTrackPoint } from "../../tracking";
import type { GeoSample } from "../ports/geolocation";
import { createFakeGeolocation } from "./fake-geolocation";

const sample: GeoSample = {
  t: 1000,
  lat: -34.6,
  lng: -58.4,
  alt: 25,
  acc: 8,
  altAcc: 3,
  spd: 2.4,
};

describe("fake geolocation", () => {
  it("delivers samples only while watching", async () => {
    const geo = createFakeGeolocation();
    const onSample = vi.fn();

    geo.emit(sample); // no watcher yet
    expect(onSample).not.toHaveBeenCalled();

    const watch = await geo.watch(onSample);
    expect(geo.isWatching()).toBe(true);
    geo.emit(sample);
    expect(onSample).toHaveBeenCalledWith(sample);

    await watch.stop();
    expect(geo.isWatching()).toBe(false);
    geo.emit(sample);
    expect(onSample).toHaveBeenCalledTimes(1); // nothing after stop
  });

  it("routes errors to the watcher", async () => {
    const geo = createFakeGeolocation();
    const onError = vi.fn();
    await geo.watch(vi.fn(), onError);

    geo.emitError({ kind: "unavailable", message: "no fix" });
    expect(onError).toHaveBeenCalledWith({ kind: "unavailable", message: "no fix" });
  });

  it("grants permission from the prompt state when requested", async () => {
    const geo = createFakeGeolocation();
    expect(await geo.checkPermission()).toBe("prompt");
    expect(await geo.requestPermission()).toBe("granted");
  });

  it("respects a preset denied permission", async () => {
    const geo = createFakeGeolocation();
    geo.setPermission("denied");
    expect(await geo.requestPermission()).toBe("denied");
  });

  it("a sample maps straight to a stored TrackPoint", () => {
    expect(toTrackPoint(sample)).toEqual({
      t: 1000,
      lat: -34.6,
      lng: -58.4,
      alt: 25,
      acc: 8,
      altAcc: 3,
      spd: 2.4,
    });
  });
});
