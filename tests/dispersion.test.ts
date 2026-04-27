import { describe, it, expect } from 'vitest';
import { refractiveIndexBK7 } from '../src/optics/dispersion';

describe('refractiveIndexBK7 (Sellmeier)', () => {
  it('matches BK7 standard at red C-line 656.3nm', () => {
    expect(refractiveIndexBK7(656.3)).toBeCloseTo(1.514, 3);
  });
  it('matches BK7 standard at yellow D-line 589.3nm', () => {
    expect(refractiveIndexBK7(589.3)).toBeCloseTo(1.517, 3);
  });
  it('matches BK7 standard at blue F-line 486.1nm', () => {
    expect(refractiveIndexBK7(486.1)).toBeCloseTo(1.522, 3);
  });
  it('violet has higher index than red (normal dispersion)', () => {
    expect(refractiveIndexBK7(420)).toBeGreaterThan(refractiveIndexBK7(680));
  });
});
