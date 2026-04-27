import {
  AdditiveBlending,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
} from 'three';

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uIntensity;
  void main() {
    float d = vUv.y - 0.5;
    float falloff = exp(-d * d * 40.0);
    float endFade = smoothstep(0.0, 0.05, vUv.x) * smoothstep(0.0, 0.05, 1.0 - vUv.x);
    float a = falloff * endFade * uIntensity;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

export function createBeamSegment(
  start: Vector3,
  end: Vector3,
  color: [number, number, number],
  intensity: number,
  thickness = 0.06,
): Mesh {
  const length = start.distanceTo(end);
  const geometry = new PlaneGeometry(length, thickness);
  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uColor: { value: color },
      uIntensity: { value: intensity },
    },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const mesh = new Mesh(geometry, material);

  const mid = start.clone().add(end).multiplyScalar(0.5);
  mesh.position.copy(mid);
  const dir = end.clone().sub(start).normalize();
  const xAxis = new Vector3(1, 0, 0);
  mesh.quaternion.setFromUnitVectors(xAxis, dir);

  return mesh;
}
