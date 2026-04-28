import {
  CanvasTexture,
  DirectionalLight,
  HemisphereLight,
  NearestFilter,
  PerspectiveCamera,
  RepeatWrapping,
  Scene,
  Vector2,
  WebGLRenderer,
} from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

function createCheckerTexture(): CanvasTexture {
  const cell = 32;
  const size = cell * 2;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#606060';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#404040';
  ctx.fillRect(0, 0, cell, cell);
  ctx.fillRect(cell, cell, cell, cell);
  const tex = new CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.repeat.set(16, 16);
  tex.magFilter = NearestFilter;
  tex.minFilter = NearestFilter;
  return tex;
}

export interface Stage {
  scene: Scene;
  renderer: WebGLRenderer;
  attach(camera: PerspectiveCamera, controls: OrbitControls): void;
  start(): void;
}

export function createStage(container: HTMLElement): Stage {
  const scene = new Scene();
  scene.background = createCheckerTexture();

  // 半球光：天空色 + 地面色，模拟自然漫反射
  const hemi = new HemisphereLight(0x9ec8ff, 0x2a2218, 0.07);
  hemi.position.set(0, 5, 0);
  scene.add(hemi);

  // 平行光：模拟太阳，从侧上方斜射
  const sun = new DirectionalLight(0xfff5e0, 0.1);
  sun.position.set(4, 6, 5);
  scene.add(sun);

  // 补光：从相机后侧补一点冷光，避免阴影面全黑
  const fill = new DirectionalLight(0xb0c8ff, 0.03);
  fill.position.set(-3, 2, -4);
  scene.add(fill);

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
