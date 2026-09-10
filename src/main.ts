import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { XRScene } from './scene';
import { setupControllers } from './controllers';
import { setupARHitTest } from './ar';
import { capabilityProbe } from './capabilities';

// --- Renderer ---
const container = document.getElementById('app') as HTMLDivElement;
const report = document.getElementById('capability-report') as HTMLElement;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true; // habilita o loop WebXR
container.appendChild(renderer.domElement);

// --- Cena ---
const xr = new XRScene();

// Órbita com o mouse no desktop focada na protoboard
const orbit = new OrbitControls(xr.camera, renderer.domElement);
orbit.target.set(0, 1.02, -0.5);
orbit.enableDamping = true;
orbit.dampingFactor = 0.05;
orbit.update();

// --- Controllers XR (VR) ---
const controllers = setupControllers(renderer, xr.scene, xr.interactive);

// --- AR hit-test ---
const arHitTest = setupARHitTest(renderer, xr.scene);

void capabilityProbe.initialize(renderer, report);

// --- Suporte a Mouse no Desktop (Mudar peças de lugar com clique e arrasto) ---
setupDesktopInteraction(renderer.domElement, xr.camera, xr.scene, xr.interactive, orbit);

// --- Loop de animação ---
const clock = new THREE.Clock();

renderer.setAnimationLoop((_timestamp, frame) => {
  const delta = clock.getDelta();
  xr.update(delta);
  controllers.update();
  orbit.update();
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

/**
 * Permite mover componentes eletrônicos usando o mouse no modo Desktop
 * sem conflitar com os controles orbitais da câmera.
 */
function setupDesktopInteraction(
  domElement: HTMLElement,
  camera: THREE.Camera,
  _scene: THREE.Scene,
  interactive: THREE.Object3D[],
  orbitControls: OrbitControls,
) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.025); // Plano na altura da mesa
  const planeIntersection = new THREE.Vector3();
  const offset = new THREE.Vector3();

  let draggedObject: THREE.Object3D | null = null;

  function findInteractiveParent(obj: THREE.Object3D | null): THREE.Object3D | null {
    let curr = obj;
    while (curr && !interactive.includes(curr)) {
      curr = curr.parent;
    }
    return curr;
  }

  domElement.addEventListener('pointerdown', (event) => {
    if (renderer.xr.isPresenting) return; // Em modo XR os controllers assumem

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(interactive, true);

    if (hits.length > 0) {
      const target = findInteractiveParent(hits[0].object);
      if (target) {
        draggedObject = target;
        orbitControls.enabled = false; // Desativa órbita para arrastar a peça

        if (raycaster.ray.intersectPlane(dragPlane, planeIntersection)) {
          offset.copy(draggedObject.position).sub(planeIntersection);
        }
      }
    }
  });

  domElement.addEventListener('pointermove', (event) => {
    if (!draggedObject) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    if (raycaster.ray.intersectPlane(dragPlane, planeIntersection)) {
      draggedObject.position.copy(planeIntersection.add(offset));
    }
  });

  const stopDrag = () => {
    if (draggedObject) {
      draggedObject = null;
      orbitControls.enabled = true; // Reabilita órbita da câmera
    }
  };

  domElement.addEventListener('pointerup', stopDrag);
  domElement.addEventListener('pointercancel', stopDrag);
}
