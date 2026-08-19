import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { XRScene } from './scene';
import { setupControllers } from './controllers';
import { setupARHitTest } from './ar';
import { capabilityProbe } from './capabilities';

// --- Renderer ---
const container = document.getElementById('app') as HTMLDivElement;
// A sonda recria apenas o conteúdo dinâmico. Controles fixos, como o botão de
// tema, ficam fora deste elemento e não são removidos por replaceChildren().
const report = document.getElementById('capability-content') as HTMLElement;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true; // habilita o loop WebXR
container.appendChild(renderer.domElement);

// --- Cena ---
const xr = new XRScene();

// Órbita com o mouse no desktop (fora do modo imersivo)
const orbit = new OrbitControls(xr.camera, renderer.domElement);
orbit.target.set(0, 1.2, -1);
orbit.update();

// --- Controllers XR ---
const controllers = setupControllers(renderer, xr.scene, xr.interactive);

// --- AR hit-test ---
const arHitTest = setupARHitTest(renderer, xr.scene);

// A sonda consulta suporte imediatamente. Recursos, entradas e DoF são
// confirmados quando a pessoa abre uma sessão real pelo próprio relatório.
void capabilityProbe.initialize(renderer, report);

// --- Loop de animação (use setAnimationLoop, NÃO requestAnimationFrame) ---
const clock = new THREE.Clock();

renderer.setAnimationLoop((_timestamp, frame) => {
  const delta = clock.getDelta();
  xr.update(delta);
  controllers.update();
  if (frame) {
    arHitTest.update(frame);
    capabilityProbe.update(frame);
  }
  renderer.render(xr.scene, xr.camera);
});

// --- Responsividade ---
window.addEventListener('resize', () => {
  xr.camera.aspect = window.innerWidth / window.innerHeight;
  xr.camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
