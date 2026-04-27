import { Vector3 } from 'three';
import { createPrism } from './scene/Prism';
import { createScreen, SCREEN_X } from './scene/Screen';
import { createSpectrumFan } from './render/SpectrumFan';
import { createCamera } from './controls/Camera';
import { createStage } from './scene/Stage';

const container = document.getElementById('app')!;
container.innerHTML = '';

const stage = createStage(container);
const { camera, controls } = createCamera(stage.renderer);
stage.attach(camera, controls);

const { mesh: prismMesh, leftFace, rightFace } = createPrism();
stage.scene.add(prismMesh);

stage.scene.add(createScreen());

const lightOrigin = new Vector3(-6, -1, 0);
const lightDirection = new Vector3(1, 0.3, 0).normalize();
const fan = createSpectrumFan(lightOrigin, lightDirection, leftFace, rightFace, SCREEN_X);
stage.scene.add(fan);

stage.start();
