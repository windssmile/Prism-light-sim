import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  Group,
  Sprite,
  SpriteMaterial,
  Vector3,
} from 'three';
import { refractiveIndexBK7 } from '../optics/dispersion';
import { traceRay, type Plane } from '../optics/traceRay';
import { wavelengthToRGB } from '../optics/wavelengthToRGB';
import { createBeamSegment } from './VolumetricBeam';

const SAMPLE_COUNT = 24;
const WAVELENGTH_MIN = 380;
const WAVELENGTH_MAX = 750;

let cachedSpotTexture: CanvasTexture | null = null;
function getSpotTexture(): CanvasTexture {
  if (cachedSpotTexture) return cachedSpotTexture;
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  cachedSpotTexture = new CanvasTexture(canvas);
  return cachedSpotTexture;
}

export function createSpectrumFan(
  origin: Vector3,
  direction: Vector3,
  leftFace: Plane,
  rightFace: Plane,
  screenX: number,
): Group {
  const group = new Group();
  const intensities: [number, number, number] = [0.4, 0.25, 0.6];

  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const t = i / (SAMPLE_COUNT - 1);
    const wavelength = WAVELENGTH_MIN + t * (WAVELENGTH_MAX - WAVELENGTH_MIN);
    const n = refractiveIndexBK7(wavelength);
    const result = traceRay(origin, direction, leftFace, rightFace, screenX, n);
    if (!result) continue;

    const color = wavelengthToRGB(wavelength);

    result.segments.forEach((seg, idx) => {
      const beam = createBeamSegment(seg.start, seg.end, color, intensities[idx]);
      group.add(beam);
    });

    const spotMat = new SpriteMaterial({
      map: getSpotTexture(),
      color: new Color(color[0], color[1], color[2]),
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const sprite = new Sprite(spotMat);
    sprite.position.copy(result.segments[2].end);
    sprite.position.x -= 0.01;
    sprite.scale.set(0.25, 0.25, 1);
    group.add(sprite);
  }

  return group;
}
