import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { traceRay, type Plane } from '../src/optics/traceRay';
import { refractiveIndexBK7 } from '../src/optics/dispersion';

function makePrismFaces(): { left: Plane; right: Plane } {
  const left: Plane = {
    point: new Vector3(-0.5, 0, 0),
    normal: new Vector3(-Math.sqrt(3) / 2, 0.5, 0).normalize(),
  };
  const right: Plane = {
    point: new Vector3(0.5, 0, 0),
    normal: new Vector3(Math.sqrt(3) / 2, 0.5, 0).normalize(),
  };
  return { left, right };
}

describe('traceRay', () => {
  it('produces three connected segments and screen hit', () => {
    const { left, right } = makePrismFaces();
    const origin = new Vector3(-3, -1, 0);
    const direction = new Vector3(1, 0.3, 0).normalize();
    const screenX = 4;
    const n = refractiveIndexBK7(589.3);

    const result = traceRay(origin, direction, left, right, screenX, n);
    expect(result).not.toBeNull();
    expect(result!.segments).toHaveLength(3);
    expect(result!.segments[0].end.distanceTo(result!.segments[1].start)).toBeLessThan(1e-9);
    expect(result!.segments[1].end.distanceTo(result!.segments[2].start)).toBeLessThan(1e-9);
    expect(result!.segments[2].end.x).toBeCloseTo(screenX, 6);
  });

  it('violet bends more than red (greater n → larger deviation)', () => {
    const { left, right } = makePrismFaces();
    const origin = new Vector3(-3, -1, 0);
    const direction = new Vector3(1, 0.3, 0).normalize();
    const screenX = 4;

    const red = traceRay(origin, direction, left, right, screenX, refractiveIndexBK7(680))!;
    const violet = traceRay(origin, direction, left, right, screenX, refractiveIndexBK7(420))!;
    expect(violet.segments[2].end.y).toBeLessThan(red.segments[2].end.y);
  });
});
