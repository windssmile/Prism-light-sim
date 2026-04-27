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
