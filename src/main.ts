import { Vector3 } from 'three';
import { createPrism } from './scene/Prism';
import { createScreen, SCREEN_X } from './scene/Screen';
import { createSpectrumFan } from './render/SpectrumFan';
import { createCamera } from './controls/Camera';
import { createStage } from './scene/Stage';
import { traceRay } from './optics/traceRay';
import { refractiveIndexSF10 } from './optics/dispersion';

const container = document.getElementById('app')!;
container.innerHTML = '';

const stage = createStage(container);
const { camera, controls } = createCamera(stage.renderer);
stage.attach(camera, controls);

const { mesh: prismMesh, leftFace, rightFace } = createPrism();
stage.scene.add(prismMesh);

// SF10 玻璃 n≈1.73，需更大入射角避免第二面全反射
const lightOrigin = new Vector3(-6, -2.5, 0);
const lightDirection = new Vector3(1, 0.5, 0).normalize();

// 用中心波长（黄光 580nm）追踪一次，把屏挪到能接住光带的位置
const probe = traceRay(
  lightOrigin,
  lightDirection,
  leftFace,
  rightFace,
  SCREEN_X,
  refractiveIndexSF10(580),
);
const screen = createScreen();
// 屏中心略低于光带中心，让色带打在屏的上半部分
if (probe) screen.position.y = probe.segments[2].end.y - 1.0;
stage.scene.add(screen);

const fan = createSpectrumFan(lightOrigin, lightDirection, leftFace, rightFace, SCREEN_X);
stage.scene.add(fan);

stage.start();
