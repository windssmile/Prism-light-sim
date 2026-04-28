import { Mesh, MeshStandardMaterial, PlaneGeometry } from 'three';

export const SCREEN_X = 7;

export function createScreen(): Mesh {
  const geometry = new PlaneGeometry(6, 5);
  const material = new MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0,
  });
  const mesh = new Mesh(geometry, material);
  mesh.position.set(SCREEN_X, 0, 0);
  mesh.rotation.y = -Math.PI / 2;
  return mesh;
}
