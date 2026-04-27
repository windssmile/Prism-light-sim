import { PerspectiveCamera, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createCamera(renderer: WebGLRenderer): {
  camera: PerspectiveCamera;
  controls: OrbitControls;
} {
  const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(3, 2, 8);
  camera.lookAt(0, 0, 0);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 4;
  controls.maxDistance = 15;
  controls.maxPolarAngle = Math.PI * 0.6;
  controls.target.set(0, 0, 0);

  return { camera, controls };
}
