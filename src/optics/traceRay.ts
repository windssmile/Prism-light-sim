import { Vector3 } from 'three';
import { refract } from './refract';

export interface Plane {
  point: Vector3;
  normal: Vector3;
}

export interface Segment {
  start: Vector3;
  end: Vector3;
}

export interface TraceResult {
  segments: [Segment, Segment, Segment];
}

function intersectPlane(origin: Vector3, dir: Vector3, plane: Plane): Vector3 | null {
  const denom = dir.dot(plane.normal);
  if (Math.abs(denom) < 1e-9) return null;
  const t = plane.point.clone().sub(origin).dot(plane.normal) / denom;
  if (t <= 1e-6) return null;
  return origin.clone().add(dir.clone().multiplyScalar(t));
}

export function traceRay(
  origin: Vector3,
  direction: Vector3,
  leftFace: Plane,
  rightFace: Plane,
  screenX: number,
  nGlass: number,
): TraceResult | null {
  const p1 = intersectPlane(origin, direction, leftFace);
  if (!p1) return null;

  const dirInGlass = refract(direction, leftFace.normal, 1, nGlass);
  if (!dirInGlass) return null;

  const p2 = intersectPlane(p1, dirInGlass, rightFace);
  if (!p2) return null;

  // 出射面：refract 约定 normal 指向入射介质一侧（此处即玻璃内部），故翻转外法线
  const innerNormal = rightFace.normal.clone().negate();
  const dirOut = refract(dirInGlass, innerNormal, nGlass, 1);
  if (!dirOut) return null;

  const screenPlane: Plane = {
    point: new Vector3(screenX, 0, 0),
    normal: new Vector3(-1, 0, 0),
  };
  const p3 = intersectPlane(p2, dirOut, screenPlane);
  if (!p3) return null;

  return {
    segments: [
      { start: origin.clone(), end: p1 },
      { start: p1.clone(), end: p2 },
      { start: p2.clone(), end: p3 },
    ],
  };
}
