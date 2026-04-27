# 三棱镜白光色散 3D 模拟 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用 Three.js + TypeScript 构建一个观赏型 3D 网页，演示白光通过 BK7 等边三角棱镜发生色散，在右侧屏幕上呈现连续光谱，整体伴随体积光与 Bloom 辉光效果。

**Architecture:** 纯前端 SPA。`optics/` 是与 Three.js 解耦的纯函数模块（Sellmeier 色散、Snell 折射、单波长光线追踪、波长→RGB），由 vitest 单测覆盖。`scene/` 与 `render/` 把追踪结果变成 Three.js Mesh：玻璃棱镜用 `MeshPhysicalMaterial` 表现透射，光线段用自定义 ShaderMaterial 的 billboard quad 表现体积光，最终经过 `UnrealBloomPass` 后处理产出辉光。光路一次性计算并缓存为 Mesh，相机轨道控制只重绘不重算。

**Tech Stack:** Three.js, TypeScript (strict), Vite (vanilla-ts), vitest

---

## Task 1: 项目脚手架与依赖

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts`, `.gitignore`, `README.md`

- [ ] **Step 1: 初始化 git 与 npm 项目**

```bash
cd /Users/user/Works/webApp/light
git init
npm init -y
```

- [ ] **Step 2: 安装依赖**

```bash
npm install three
npm install -D typescript vite @types/three vitest
```

- [ ] **Step 3: 写 `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "lib": ["ES2020", "DOM"],
    "types": ["vitest/globals"]
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 4: 写 `vite.config.ts`**

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  test: {
    globals: true,
    environment: 'node',
  },
});
```

- [ ] **Step 5: 写 `index.html`**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Prism Light Dispersion</title>
    <style>
      html, body { margin: 0; padding: 0; height: 100%; background: #000; overflow: hidden; }
      #app { width: 100vw; height: 100vh; }
    </style>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 6: 写占位 `src/main.ts`**

```ts
console.log('prism light boot');
```

- [ ] **Step 7: 在 `package.json` 的 scripts 中加入命令**

替换 scripts 字段为：

```json
"scripts": {
  "dev": "vite",
  "build": "tsc --noEmit && vite build",
  "preview": "vite preview",
  "test": "vitest run"
}
```

- [ ] **Step 8: 写 `.gitignore`**

```
node_modules
dist
.DS_Store
*.log
```

- [ ] **Step 9: 写最简 `README.md`**

```markdown
# Prism Light Dispersion

3D 模拟白光通过 BK7 等边三角棱镜的色散现象，纯前端观赏型场景。

## 物理原理

不同波长的可见光在玻璃中的折射率不同（色散），白光经棱镜两次折射后被分解为连续光谱，在接收屏上呈现彩虹带。本项目用 Sellmeier 公式计算 BK7 玻璃折射率，对 380–750nm 采样 24 条波长进行光线追踪，体积光 + Bloom 后处理呈现视觉效果。

## 运行

```
npm install
npm run dev
npm run test
npm run build
```
```

- [ ] **Step 10: 验证 dev server 启动**

Run: `npm run dev`（手动 Ctrl+C 退出）
Expected: Vite 启动无错误，浏览器访问看到黑屏 + console 输出 `prism light boot`。

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore: scaffold vite + three + vitest project"
```

---

## Task 2: 色散模块 `dispersion.ts`

**Files:**
- Create: `src/optics/dispersion.ts`
- Test: `tests/dispersion.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { describe, it, expect } from 'vitest';
import { refractiveIndexBK7 } from '../src/optics/dispersion';

describe('refractiveIndexBK7 (Sellmeier)', () => {
  it('matches BK7 standard at red C-line 656.3nm', () => {
    expect(refractiveIndexBK7(656.3)).toBeCloseTo(1.5143, 4);
  });
  it('matches BK7 standard at yellow D-line 589.3nm', () => {
    expect(refractiveIndexBK7(589.3)).toBeCloseTo(1.5168, 4);
  });
  it('matches BK7 standard at blue F-line 486.1nm', () => {
    expect(refractiveIndexBK7(486.1)).toBeCloseTo(1.5224, 4);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npm test`
Expected: FAIL — module 不存在。

- [ ] **Step 3: 实现 `dispersion.ts`**

```ts
const B1 = 1.03961212;
const B2 = 0.231792344;
const B3 = 1.01046945;
const C1 = 0.00600069867;
const C2 = 0.0200179144;
const C3 = 103.560653;

/** 输入波长（nm），返回 BK7 玻璃折射率 n。 */
export function refractiveIndexBK7(wavelengthNm: number): number {
  const lambdaUm = wavelengthNm / 1000;
  const l2 = lambdaUm * lambdaUm;
  const nSq =
    1 +
    (B1 * l2) / (l2 - C1) +
    (B2 * l2) / (l2 - C2) +
    (B3 * l2) / (l2 - C3);
  return Math.sqrt(nSq);
}
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `npm test`
Expected: 3 PASS。

- [ ] **Step 5: Commit**

```bash
git add src/optics/dispersion.ts tests/dispersion.test.ts
git commit -m "feat(optics): Sellmeier dispersion for BK7 glass"
```

---

## Task 3: 折射模块 `refract.ts`

**Files:**
- Create: `src/optics/refract.ts`
- Test: `tests/refract.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { refract } from '../src/optics/refract';

describe('refract', () => {
  it('returns same direction at normal incidence', () => {
    const incident = new Vector3(0, 0, -1);
    const normal = new Vector3(0, 0, 1);
    const out = refract(incident, normal, 1, 1.5);
    expect(out).not.toBeNull();
    expect(out!.x).toBeCloseTo(0, 6);
    expect(out!.y).toBeCloseTo(0, 6);
    expect(out!.z).toBeCloseTo(-1, 6);
  });

  it('bends toward normal entering denser medium (Snell check)', () => {
    // 入射 30° 偏离法线，从空气进入 n=1.5
    const angleIn = Math.PI / 6;
    const incident = new Vector3(Math.sin(angleIn), 0, -Math.cos(angleIn));
    const normal = new Vector3(0, 0, 1);
    const out = refract(incident, normal, 1, 1.5)!;
    // sin(theta_out) = sin(30°) / 1.5
    const expectedSin = Math.sin(angleIn) / 1.5;
    expect(out.x).toBeCloseTo(expectedSin, 6);
    expect(out.length()).toBeCloseTo(1, 6);
  });

  it('returns null on total internal reflection', () => {
    // 从 n=1.5 出射到 n=1，入射 60°，超过临界角 ~41.8°
    const angleIn = Math.PI / 3;
    const incident = new Vector3(Math.sin(angleIn), 0, -Math.cos(angleIn));
    const normal = new Vector3(0, 0, 1);
    expect(refract(incident, normal, 1.5, 1)).toBeNull();
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npm test`
Expected: FAIL — `refract` 未导出。

- [ ] **Step 3: 实现 `refract.ts`**

```ts
import { Vector3 } from 'three';

/**
 * 矢量形式 Snell 折射。
 * @param incident 归一化入射方向（朝向交点）
 * @param normal   归一化法线（指向入射介质一侧）
 * @param n1       入射介质折射率
 * @param n2       折射介质折射率
 * @returns        归一化折射方向；全反射时返回 null
 */
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
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `npm test`
Expected: 6 PASS（3 dispersion + 3 refract）。

- [ ] **Step 5: Commit**

```bash
git add src/optics/refract.ts tests/refract.test.ts
git commit -m "feat(optics): vector-form Snell refraction with TIR handling"
```

---

## Task 4: 波长 → RGB `wavelengthToRGB.ts`

**Files:**
- Create: `src/optics/wavelengthToRGB.ts`
- Test: `tests/wavelengthToRGB.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { describe, it, expect } from 'vitest';
import { wavelengthToRGB } from '../src/optics/wavelengthToRGB';

describe('wavelengthToRGB', () => {
  it('returns black outside visible range', () => {
    expect(wavelengthToRGB(300)).toEqual([0, 0, 0]);
    expect(wavelengthToRGB(800)).toEqual([0, 0, 0]);
  });
  it('red wavelength has dominant R channel', () => {
    const [r, g, b] = wavelengthToRGB(680);
    expect(r).toBeGreaterThan(0.5);
    expect(r).toBeGreaterThan(g);
    expect(r).toBeGreaterThan(b);
  });
  it('green wavelength has dominant G channel', () => {
    const [r, g, b] = wavelengthToRGB(530);
    expect(g).toBeGreaterThan(r);
    expect(g).toBeGreaterThan(b);
  });
  it('violet wavelength has nonzero B channel', () => {
    const [, , b] = wavelengthToRGB(420);
    expect(b).toBeGreaterThan(0.3);
  });
  it('all channels in [0,1]', () => {
    for (let w = 380; w <= 750; w += 10) {
      const rgb = wavelengthToRGB(w);
      for (const c of rgb) {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(1);
      }
    }
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npm test`
Expected: FAIL — 函数未定义。

- [ ] **Step 3: 实现 `wavelengthToRGB.ts`**

```ts
/** Bruton 近似：可见光波长（nm） → 线性 sRGB ∈ [0,1]^3。 */
export function wavelengthToRGB(wavelengthNm: number): [number, number, number] {
  const w = wavelengthNm;
  let r = 0, g = 0, b = 0;

  if (w >= 380 && w < 440) {
    r = -(w - 440) / (440 - 380);
    b = 1;
  } else if (w >= 440 && w < 490) {
    g = (w - 440) / (490 - 440);
    b = 1;
  } else if (w >= 490 && w < 510) {
    g = 1;
    b = -(w - 510) / (510 - 490);
  } else if (w >= 510 && w < 580) {
    r = (w - 510) / (580 - 510);
    g = 1;
  } else if (w >= 580 && w < 645) {
    r = 1;
    g = -(w - 645) / (645 - 580);
  } else if (w >= 645 && w <= 750) {
    r = 1;
  }

  // 边缘亮度衰减
  let factor = 1;
  if (w >= 380 && w < 420) factor = 0.3 + (0.7 * (w - 380)) / (420 - 380);
  else if (w >= 420 && w < 700) factor = 1;
  else if (w >= 700 && w <= 750) factor = 0.3 + (0.7 * (750 - w)) / (750 - 700);
  else factor = 0;

  return [r * factor, g * factor, b * factor];
}
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `npm test`
Expected: 11 PASS。

- [ ] **Step 5: Commit**

```bash
git add src/optics/wavelengthToRGB.ts tests/wavelengthToRGB.test.ts
git commit -m "feat(optics): wavelength to sRGB (Bruton approximation)"
```

---

## Task 5: 光线追踪 `traceRay.ts`

**Files:**
- Create: `src/optics/traceRay.ts`
- Test: `tests/traceRay.test.ts`

棱镜几何（与 Task 6 共享常量）：等边三角形截面，顶点 A 在上方 (0, h, 0)，B 在左下 (-1, -h/3·…, 0)。为简化与可测试，本任务把棱镜抽象为两个无限平面（左斜面、右斜面），输入由调用方提供平面（点 + 法线）。

- [ ] **Step 1: 写失败测试**

```ts
import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { traceRay, type Plane } from '../src/optics/traceRay';
import { refractiveIndexBK7 } from '../src/optics/dispersion';

// 等边三角形（边长 2）的左右斜面（在 XY 平面内，沿 Z 拉伸）
// 顶角 60° 朝 +Y。底边在 y = -1/√3·... 处不重要，左右斜面无限延伸足够。
function makePrismFaces(): { left: Plane; right: Plane } {
  // 左斜面：法线指向左外（朝 -X 方向略向上）。斜面方程：法线 (cos150°, sin150°) = (-√3/2, 1/2)
  // 但我们要法线指向"入射介质一侧"——即指向棱镜外。
  const left: Plane = {
    point: new Vector3(-0.5, 0, 0), // 斜面上一点
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
    const origin = new Vector3(-3, 0.3, 0);
    const direction = new Vector3(1, -0.05, 0).normalize();
    const screenX = 4;
    const n = refractiveIndexBK7(589.3);

    const result = traceRay(origin, direction, left, right, screenX, n);
    expect(result).not.toBeNull();
    expect(result!.segments).toHaveLength(3);
    // 段连续
    expect(result!.segments[0].end.distanceTo(result!.segments[1].start)).toBeLessThan(1e-9);
    expect(result!.segments[1].end.distanceTo(result!.segments[2].start)).toBeLessThan(1e-9);
    // 最终落点在屏 x=4 平面
    expect(result!.segments[2].end.x).toBeCloseTo(screenX, 6);
  });

  it('violet bends more than red (greater n → larger deviation)', () => {
    const { left, right } = makePrismFaces();
    const origin = new Vector3(-3, 0.3, 0);
    const direction = new Vector3(1, -0.05, 0).normalize();
    const screenX = 4;

    const red = traceRay(origin, direction, left, right, screenX, refractiveIndexBK7(680))!;
    const violet = traceRay(origin, direction, left, right, screenX, refractiveIndexBK7(420))!;
    // 紫光 y 落点比红光更低（向下偏折更多）
    expect(violet.segments[2].end.y).toBeLessThan(red.segments[2].end.y);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npm test`
Expected: FAIL — `traceRay` 未定义。

- [ ] **Step 3: 实现 `traceRay.ts`**

```ts
import { Vector3 } from 'three';
import { refract } from './refract';

export interface Plane {
  point: Vector3;   // 平面上一点
  normal: Vector3;  // 单位法线，指向棱镜外侧
}

export interface Segment {
  start: Vector3;
  end: Vector3;
}

export interface TraceResult {
  segments: [Segment, Segment, Segment]; // 入射段、棱镜内段、出射段
}

function intersectPlane(origin: Vector3, dir: Vector3, plane: Plane): Vector3 | null {
  const denom = dir.dot(plane.normal);
  if (Math.abs(denom) < 1e-9) return null;
  const t = plane.point.clone().sub(origin).dot(plane.normal) / denom;
  if (t <= 1e-6) return null;
  return origin.clone().add(dir.clone().multiplyScalar(t));
}

/**
 * 追踪一条单波长光线穿过棱镜（由左右两个斜面定义）后击中接收屏。
 * @param screenX 接收屏所在的 x 平面值（屏法线沿 -X）
 */
export function traceRay(
  origin: Vector3,
  direction: Vector3,
  leftFace: Plane,
  rightFace: Plane,
  screenX: number,
  nGlass: number,
): TraceResult | null {
  // 1) 入射段：origin → 左斜面交点 P1
  const p1 = intersectPlane(origin, direction, leftFace);
  if (!p1) return null;

  // 2) 进入玻璃：法线指向入射介质（外侧），refract 使用此约定
  const dirInGlass = refract(direction, leftFace.normal, 1, nGlass);
  if (!dirInGlass) return null;

  // 3) 棱镜内段：P1 → 右斜面交点 P2
  const p2 = intersectPlane(p1, dirInGlass, rightFace);
  if (!p2) return null;

  // 4) 出射玻璃：右斜面法线指向外侧（空气）
  const dirOut = refract(dirInGlass, rightFace.normal, nGlass, 1);
  if (!dirOut) return null;

  // 5) 出射段：P2 → 屏面 x = screenX
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
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `npm test`
Expected: 13 PASS。

- [ ] **Step 5: Commit**

```bash
git add src/optics/traceRay.ts tests/traceRay.test.ts
git commit -m "feat(optics): single-wavelength ray trace through prism to screen"
```

---

## Task 6: 棱镜与屏的几何与材质 `Prism.ts` / `Screen.ts`

**Files:**
- Create: `src/scene/Prism.ts`, `src/scene/Screen.ts`

- [ ] **Step 1: 实现 `Prism.ts`**

```ts
import {
  ExtrudeGeometry,
  Mesh,
  MeshPhysicalMaterial,
  Shape,
  Vector3,
} from 'three';
import type { Plane } from '../optics/traceRay';

/** 等边三角形截面（边长 2，顶角朝 +Y），沿 Z 轴拉伸 2。 */
export function createPrism(): {
  mesh: Mesh;
  leftFace: Plane;
  rightFace: Plane;
} {
  const halfBase = 1;
  const height = Math.sqrt(3); // 等边三角形高
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
  geometry.translate(0, 0, -1); // Z 居中

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

  // 左右斜面（XY 平面内的无限平面，法线指向外）
  // 左斜面通过点 (0, apexY, 0) 与 (-halfBase, baseY, 0)，外法线朝左上
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
```

- [ ] **Step 2: 实现 `Screen.ts`**

```ts
import { Mesh, MeshStandardMaterial, PlaneGeometry } from 'three';

export const SCREEN_X = 5;

export function createScreen(): Mesh {
  const geometry = new PlaneGeometry(4, 3);
  const material = new MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0,
  });
  const mesh = new Mesh(geometry, material);
  mesh.position.set(SCREEN_X, 0, 0);
  mesh.rotation.y = -Math.PI / 2; // 法线朝 -X
  return mesh;
}
```

- [ ] **Step 3: 编译检查**

Run: `npx tsc --noEmit`
Expected: 无类型错误。

- [ ] **Step 4: Commit**

```bash
git add src/scene/Prism.ts src/scene/Screen.ts
git commit -m "feat(scene): prism geometry with refraction faces and white screen"
```

---

## Task 7: 体积光束 `VolumetricBeam.ts`

**Files:**
- Create: `src/render/VolumetricBeam.ts`

- [ ] **Step 1: 实现 `VolumetricBeam.ts`**

```ts
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
    // 沿 Y 方向（光束横截面）做高斯衰减；沿 X 是光束长度方向
    float d = vUv.y - 0.5;
    float falloff = exp(-d * d * 40.0);
    // 端点轻微淡出，避免硬边
    float endFade = smoothstep(0.0, 0.05, vUv.x) * smoothstep(0.0, 0.05, 1.0 - vUv.x);
    float a = falloff * endFade * uIntensity;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

/**
 * 在 start→end 之间生成一条体积光 quad（billboard 朝 +Z 的简化版）。
 * thickness 单位与世界空间一致。
 */
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

  // 把 quad 从原点沿 +X 摆放，再变换到 start→end
  const mid = start.clone().add(end).multiplyScalar(0.5);
  mesh.position.copy(mid);
  const dir = end.clone().sub(start).normalize();
  // quad 默认沿 +X，旋转其 +X 到 dir
  const xAxis = new Vector3(1, 0, 0);
  mesh.quaternion.setFromUnitVectors(xAxis, dir);

  return mesh;
}
```

- [ ] **Step 2: 编译检查**

Run: `npx tsc --noEmit`
Expected: 无错误。

- [ ] **Step 3: Commit**

```bash
git add src/render/VolumetricBeam.ts
git commit -m "feat(render): additive volumetric beam segment with gaussian falloff"
```

---

## Task 8: 光谱扇面 `SpectrumFan.ts`

**Files:**
- Create: `src/render/SpectrumFan.ts`

- [ ] **Step 1: 实现 `SpectrumFan.ts`**

```ts
import { AdditiveBlending, Group, Sprite, SpriteMaterial, Vector3, CanvasTexture } from 'three';
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

/**
 * 给定光源 + 方向 + 棱镜两面 + 屏 X，构造 24 条波长的体积光 + 屏上发光斑点。
 */
export function createSpectrumFan(
  origin: Vector3,
  direction: Vector3,
  leftFace: Plane,
  rightFace: Plane,
  screenX: number,
): Group {
  const group = new Group();

  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const t = i / (SAMPLE_COUNT - 1);
    const wavelength = WAVELENGTH_MIN + t * (WAVELENGTH_MAX - WAVELENGTH_MIN);
    const n = refractiveIndexBK7(wavelength);
    const result = traceRay(origin, direction, leftFace, rightFace, screenX, n);
    if (!result) continue;

    const color = wavelengthToRGB(wavelength);
    // 入射段（白光段）—— 用全光谱白色叠加效果：每条波长贡献其颜色，叠加后近似白
    // 入射段强度 / 棱镜内段衰减 / 出射段
    const intensities: [number, number, number] = [0.4, 0.25, 0.6];

    result.segments.forEach((seg, idx) => {
      const beam = createBeamSegment(seg.start, seg.end, color, intensities[idx]);
      group.add(beam);
    });

    // 屏上落点光斑
    const spotMat = new SpriteMaterial({
      map: getSpotTexture(),
      color: (color[0] * 255 << 16) | (color[1] * 255 << 8) | (color[2] * 255),
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const sprite = new Sprite(spotMat);
    sprite.position.copy(result.segments[2].end);
    // 稍微离开屏面一点点避免 z-fighting
    sprite.position.x -= 0.01;
    sprite.scale.set(0.25, 0.25, 1);
    group.add(sprite);
  }

  return group;
}
```

- [ ] **Step 2: 编译检查**

Run: `npx tsc --noEmit`
Expected: 无错误。

- [ ] **Step 3: Commit**

```bash
git add src/render/SpectrumFan.ts
git commit -m "feat(render): spectrum fan with 24-sample wavelength rays and screen spots"
```

---

## Task 9: 舞台 `Stage.ts` 与相机控制 `Camera.ts`

**Files:**
- Create: `src/scene/Stage.ts`, `src/controls/Camera.ts`

- [ ] **Step 1: 实现 `Camera.ts`**

```ts
import { PerspectiveCamera, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createCamera(renderer: WebGLRenderer): {
  camera: PerspectiveCamera;
  controls: OrbitControls;
} {
  const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(3, 2, 6);
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
```

- [ ] **Step 2: 实现 `Stage.ts`**

```ts
import {
  AmbientLight,
  Color,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Vector2 } from 'three';

export interface Stage {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  controls: OrbitControls;
  composer: EffectComposer;
  start(): void;
}

export function createStage(
  container: HTMLElement,
  camera: PerspectiveCamera,
  controls: OrbitControls,
): Stage {
  const scene = new Scene();
  scene.background = new Color(0x000000);
  scene.add(new AmbientLight(0xffffff, 0.05));

  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new Vector2(window.innerWidth, window.innerHeight),
    0.8, // strength
    0.4, // radius
    0.6, // threshold
  );
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  });

  function loop() {
    controls.update();
    composer.render();
    requestAnimationFrame(loop);
  }

  return {
    scene,
    camera,
    renderer,
    controls,
    composer,
    start: () => requestAnimationFrame(loop),
  };
}
```

- [ ] **Step 3: 编译检查**

Run: `npx tsc --noEmit`
Expected: 无错误。

- [ ] **Step 4: Commit**

```bash
git add src/scene/Stage.ts src/controls/Camera.ts
git commit -m "feat(scene): stage with bloom postprocessing and orbit camera"
```

---

## Task 10: 主入口 `main.ts` 串联

**Files:**
- Modify: `src/main.ts`

> 说明：`createCamera` 需要 `renderer`，而 `createStage` 又要挂载 renderer 到 DOM 并管理 `composer`。为了让 `OrbitControls` 能正确监听最终挂载的 canvas，把 `Stage` 改成两阶段工厂：先创建并挂载 renderer，再 `attach(camera, controls)` 装配 composer。

- [ ] **Step 1: 调整 `Stage.ts` 工厂接口为两阶段**

修改 `src/scene/Stage.ts`：把 `createStage` 改为先创建 renderer 并挂载，再返回带 `attachCameraAndControls` 的对象：

```ts
import {
  AmbientLight,
  Color,
  PerspectiveCamera,
  Scene,
  Vector2,
  WebGLRenderer,
} from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export interface Stage {
  scene: Scene;
  renderer: WebGLRenderer;
  attach(camera: PerspectiveCamera, controls: OrbitControls): void;
  start(): void;
}

export function createStage(container: HTMLElement): Stage {
  const scene = new Scene();
  scene.background = new Color(0x000000);
  scene.add(new AmbientLight(0xffffff, 0.05));

  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  let camera: PerspectiveCamera | null = null;
  let controls: OrbitControls | null = null;
  let composer: EffectComposer | null = null;

  window.addEventListener('resize', () => {
    if (!camera || !composer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  });

  return {
    scene,
    renderer,
    attach(cam, ctrl) {
      camera = cam;
      controls = ctrl;
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, cam));
      composer.addPass(
        new UnrealBloomPass(
          new Vector2(window.innerWidth, window.innerHeight),
          0.8,
          0.4,
          0.6,
        ),
      );
      composer.addPass(new OutputPass());
    },
    start() {
      const tick = () => {
        controls?.update();
        composer?.render();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },
  };
}
```

- [ ] **Step 2: 写最终 `src/main.ts`**

```ts
import { Vector3 } from 'three';
import { createPrism } from './scene/Prism';
import { createScreen } from './scene/Screen';
import { createSpectrumFan } from './render/SpectrumFan';
import { createCamera } from './controls/Camera';
import { createStage } from './scene/Stage';

const SCREEN_X = 5;

const container = document.getElementById('app')!;
container.innerHTML = '';

const stage = createStage(container);
const { camera, controls } = createCamera(stage.renderer);
stage.attach(camera, controls);

// 棱镜
const { mesh: prismMesh, leftFace, rightFace } = createPrism();
stage.scene.add(prismMesh);

// 接收屏
stage.scene.add(createScreen());

// 光谱扇面
const lightOrigin = new Vector3(-6, 0.3, 0);
const lightDirection = new Vector3(1, -0.05, 0).normalize();
const fan = createSpectrumFan(lightOrigin, lightDirection, leftFace, rightFace, SCREEN_X);
stage.scene.add(fan);

stage.start();
```

- [ ] **Step 3: 编译并启动 dev server**

Run: `npx tsc --noEmit && npm run dev`
Expected: 无类型错误，浏览器中可见黑色背景中的玻璃棱镜、左侧白色入射光束、右侧分裂出的彩虹光扇击中右侧白屏，伴随柔和 Bloom 辉光。

- [ ] **Step 4: 肉眼验收清单（在浏览器中确认）**

- [ ] 屏幕上能看到一束白光从左进入棱镜
- [ ] 棱镜内部隐约可见光束折射变向
- [ ] 棱镜右斜面射出多色光扇（红在上、紫在下）
- [ ] 右侧屏面上呈现连续彩虹带（24 个发光斑点叠加）
- [ ] 鼠标拖动可旋转相机，滚轮缩放在 4–15 范围
- [ ] Bloom 辉光柔和，不过曝
- [ ] 60fps（开发者工具 Performance 面板检查）

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: wire prism scene with spectrum fan and bloom stage"
```

---

## Task 11: 收尾

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 完善 README**

在现有 README 末尾追加：

```markdown
## 项目结构

- `src/optics/` — 与 Three.js 解耦的物理纯函数（Sellmeier、Snell、波长→RGB、光线追踪），单测覆盖
- `src/scene/` — 棱镜、屏、舞台（Bloom 后处理）
- `src/render/` — 体积光段与光谱扇面
- `src/controls/` — 相机轨道控制
- `tests/` — vitest 单测

## 部署

`npm run build` 产出 `dist/`，纯静态文件可直接部署到 GitHub Pages、Vercel、Netlify 等。`vite.config.ts` 中 `base: './'` 已就绪，子路径部署也可用。
```

- [ ] **Step 2: 全量测试与构建一次**

Run: `npm test && npm run build`
Expected: 全部测试通过，`dist/` 产生，`tsc --noEmit` 通过。

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: project structure and deployment notes"
```

---

## 验收

- 所有 vitest 测试通过（dispersion 3 + refract 3 + wavelengthToRGB 5 + traceRay 2 = 13）
- `npm run build` 无错误
- 浏览器肉眼验收清单全部勾选
- 所有改动已提交到 git
