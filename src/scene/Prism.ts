import {
  ExtrudeGeometry,
  Mesh,
  MeshPhysicalMaterial,
  Shape,
  Vector3,
} from 'three';
import type { Plane } from '../optics/traceRay';

export function createPrism(): {
  mesh: Mesh;
  leftFace: Plane;
  rightFace: Plane;
} {
  const halfBase = 1;
  const height = Math.sqrt(3);
  const apexY = (2 * height) / 3;
  const baseY = -height / 3;

  const shape = new Shape();
  shape.moveTo(0, apexY);
  shape.lineTo(-halfBase, baseY);
  shape.lineTo(halfBase, baseY);
  shape.lineTo(0, apexY);

  const geometry = new ExtrudeGeometry(shape, {
    depth: 2,
    bevelEnabled: false,
  });
  geometry.translate(0, 0, -1);

  const material = new MeshPhysicalMaterial({
    transmission: 1,
    ior: 1.52,
    roughness: 0,
    thickness: 1,
    metalness: 0,
    clearcoat: 1,
    color: 0xffffff,
  });

  const mesh = new Mesh(geometry, material);

  const leftFace: Plane = {
    point: new Vector3(-halfBase / 2, (apexY + baseY) / 2, 0),
    normal: new Vector3(-height, halfBase, 0).normalize(),
  };
  const rightFace: Plane = {
    point: new Vector3(halfBase / 2, (apexY + baseY) / 2, 0),
    normal: new Vector3(height, halfBase, 0).normalize(),
  };

  return { mesh, leftFace, rightFace };
}
