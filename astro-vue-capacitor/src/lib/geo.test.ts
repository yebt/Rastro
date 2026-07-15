import { describe, expect, it } from 'vitest';
import { haversine } from './geo';

describe('haversine', () => {
  it('is zero for the same point', () => {
    expect(haversine({ lat: 4.65, lng: -74.08 }, { lat: 4.65, lng: -74.08 })).toBe(0);
  });

  it('approximates ~111.3m for 0.001° of latitude', () => {
    const d = haversine({ lat: 0, lng: 0 }, { lat: 0.001, lng: 0 });
    expect(d).toBeGreaterThan(110);
    expect(d).toBeLessThan(113);
  });

  it('is symmetric', () => {
    const a = { lat: 4.6533, lng: -74.0836 };
    const b = { lat: 4.6543, lng: -74.0846 };
    expect(haversine(a, b)).toBeCloseTo(haversine(b, a), 6);
  });
});
