import { Vector3 } from 'three';

export function refract(
  incident: Vector3,
  normal: Vector3,
  n1: number,
  n2: number,
): Vector3 | null {
  const eta = n1 / n2;
  const cosI = -incident.dot(normal);
  const sinT2 = eta * eta * (1 - cosI * cosI);
  if (sinT2 > 1) return null;
  const cosT = Math.sqrt(1 - sinT2);
  return incident
    .clone()
    .multiplyScalar(eta)
    .add(normal.clone().multiplyScalar(eta * cosI - cosT))
    .normalize();
}
