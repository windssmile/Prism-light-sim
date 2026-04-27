import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { refract } from '../src/optics/refract';

describe('refract', () => {
  it('returns same direction at normal incidence', () => {
    const incident = new Vector3(0, 0, -1);
    const normal = new Vector3(0, 0, 1);
    const out = refract(incident, normal, 1, 1.5);
    expect(out).not.toBeNull();
    expect(out!.x).toBeCloseTo(0, 6);
    expect(out!.y).toBeCloseTo(0, 6);
    expect(out!.z).toBeCloseTo(-1, 6);
  });

  it('bends toward normal entering denser medium (Snell check)', () => {
    const angleIn = Math.PI / 6;
    const incident = new Vector3(Math.sin(angleIn), 0, -Math.cos(angleIn));
    const normal = new Vector3(0, 0, 1);
    const out = refract(incident, normal, 1, 1.5)!;
    const expectedSin = Math.sin(angleIn) / 1.5;
    expect(out.x).toBeCloseTo(expectedSin, 6);
    expect(out.length()).toBeCloseTo(1, 6);
  });

  it('returns null on total internal reflection', () => {
    const angleIn = Math.PI / 3;
    const incident = new Vector3(Math.sin(angleIn), 0, -Math.cos(angleIn));
    const normal = new Vector3(0, 0, 1);
    expect(refract(incident, normal, 1.5, 1)).toBeNull();
  });
});
