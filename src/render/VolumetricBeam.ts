import {
  AdditiveBlending,
  Group,
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
  thickness = 0.08,
): Group {
  const length = start.distanceTo(end);
  const dir = end.clone().sub(start).normalize();
  const mid = start.clone().add(end).multiplyScalar(0.5);
  const xAxis = new Vector3(1, 0, 0);

  const group = new Group();
  group.position.copy(mid);
  group.quaternion.setFromUnitVectors(xAxis, dir);

  // 两片正交平面（XY + XZ），任意视角都能看到光柱厚度
  for (let i = 0; i < 2; i++) {
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
    if (i === 1) mesh.rotation.x = Math.PI / 2;
    group.add(mesh);
  }

  return group;
}
