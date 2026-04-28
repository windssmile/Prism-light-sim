import {
  AdditiveBlending,
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  Vector3,
} from 'three';
import { refractiveIndexSF10 } from '../optics/dispersion';
import { traceRay, type Plane } from '../optics/traceRay';
import { wavelengthToRGB } from '../optics/wavelengthToRGB';
import { createBeamSegment } from './VolumetricBeam';

const SAMPLE_COUNT = 48;
const FIBER_COUNT = 8;
const FIBER_THICKNESS = 0.025;
const WAVELENGTH_MIN = 380;
const WAVELENGTH_MAX = 750;
const RIBBON_HALF_THICKNESS = 0.25;
const RIBBON_OFFSET = 0.02;

interface Sample {
  p1: Vector3;
  p2: Vector3;
  p3: Vector3;
  color: [number, number, number];
}

function makeColoredMesh(
  positions: number[],
  colors: number[],
  indices: number[],
  opacity: number,
): Mesh {
  const geom = new BufferGeometry();
  geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geom.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geom.setIndex(indices);
  const mat = new MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    side: DoubleSide,
    opacity,
  });
  return new Mesh(geom, mat);
}

export function createSpectrumFan(
  origin: Vector3,
  direction: Vector3,
  leftFace: Plane,
  rightFace: Plane,
  screenX: number,
): Group {
  const group = new Group();
  const samples: Sample[] = [];

  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const t = i / (SAMPLE_COUNT - 1);
    const wavelength = WAVELENGTH_MIN + t * (WAVELENGTH_MAX - WAVELENGTH_MIN);
    const n = refractiveIndexSF10(wavelength);
    const result = traceRay(origin, direction, leftFace, rightFace, screenX, n);
    if (!result) continue;
    samples.push({
      p1: result.segments[0].end,
      p2: result.segments[1].end,
      p3: result.segments[2].end,
      color: wavelengthToRGB(wavelength),
    });
  }

  if (samples.length < 2) return group;

  // 1) 入射段：共享 P1，单条白色体积光柱
  group.add(createBeamSegment(origin, samples[0].p1, [1, 1, 1], 0.6));

  // 2) 棱镜内段：以 P1 为公共顶点的扇形面，apex 白色，base 渐变彩色
  {
    const positions: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    const apex = samples[0].p1;
    positions.push(apex.x, apex.y, apex.z);
    colors.push(1, 1, 1);
    samples.forEach((s) => {
      positions.push(s.p2.x, s.p2.y, s.p2.z);
      colors.push(s.color[0], s.color[1], s.color[2]);
    });
    for (let i = 1; i < samples.length; i++) {
      indices.push(0, i, i + 1);
    }
    group.add(makeColoredMesh(positions, colors, indices, 0.3));
  }

  // 3) 出射段：P2 曲线 → P3 曲线之间的 ribbon，每条波长两端同色，相邻插值
  {
    const positions: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    samples.forEach((s) => {
      positions.push(s.p2.x, s.p2.y, s.p2.z);
      colors.push(s.color[0], s.color[1], s.color[2]);
      positions.push(s.p3.x, s.p3.y, s.p3.z);
      colors.push(s.color[0], s.color[1], s.color[2]);
    });
    for (let i = 0; i < samples.length - 1; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      indices.push(a, b, d, a, d, c);
    }
    group.add(makeColoredMesh(positions, colors, indices, 0.4));
  }

  // 3.5) 在面之上叠加 8 条细丝光柱：从 N 个采样里选取等间距的 8 个，
  // 用窄体积光柱把"丝"的视觉感留住
  {
    const step = (samples.length - 1) / (FIBER_COUNT - 1);
    for (let k = 0; k < FIBER_COUNT; k++) {
      const idx = Math.round(k * step);
      const s = samples[idx];
      group.add(createBeamSegment(s.p1, s.p2, s.color, 0.55, FIBER_THICKNESS));
      group.add(createBeamSegment(s.p2, s.p3, s.color, 0.7, FIBER_THICKNESS));
    }
  }

  // 4) 屏上彩虹带：在屏前 RIBBON_OFFSET 处沿 z 撑出厚度
  {
    const positions: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    samples.forEach((s) => {
      positions.push(s.p3.x - RIBBON_OFFSET, s.p3.y, s.p3.z + RIBBON_HALF_THICKNESS);
      colors.push(s.color[0], s.color[1], s.color[2]);
      positions.push(s.p3.x - RIBBON_OFFSET, s.p3.y, s.p3.z - RIBBON_HALF_THICKNESS);
      colors.push(s.color[0], s.color[1], s.color[2]);
    });
    for (let i = 0; i < samples.length - 1; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      indices.push(a, b, d, a, d, c);
    }
    group.add(makeColoredMesh(positions, colors, indices, 1));
  }

  return group;
}
