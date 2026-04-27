import { describe, it, expect } from 'vitest';
import { wavelengthToRGB } from '../src/optics/wavelengthToRGB';

describe('wavelengthToRGB', () => {
  it('returns black outside visible range', () => {
    expect(wavelengthToRGB(300)).toEqual([0, 0, 0]);
    expect(wavelengthToRGB(800)).toEqual([0, 0, 0]);
  });
  it('red wavelength has dominant R channel', () => {
    const [r, g, b] = wavelengthToRGB(680);
    expect(r).toBeGreaterThan(0.5);
    expect(r).toBeGreaterThan(g);
    expect(r).toBeGreaterThan(b);
  });
  it('green wavelength has dominant G channel', () => {
    const [r, g, b] = wavelengthToRGB(530);
    expect(g).toBeGreaterThan(r);
    expect(g).toBeGreaterThan(b);
  });
  it('violet wavelength has nonzero B channel', () => {
    const [, , b] = wavelengthToRGB(420);
    expect(b).toBeGreaterThan(0.3);
  });
  it('all channels in [0,1]', () => {
    for (let w = 380; w <= 750; w += 10) {
      const rgb = wavelengthToRGB(w);
      for (const c of rgb) {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(1);
      }
    }
  });
});
