import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

/**
 * Configura os controllers XR:
 *  - modelo 3D do controle
 *  - raio laser de mira
 *  - pegar (attach) e soltar (reparenting) objetos simples ou grupos compostos (LEDs, fios, etc.)
 */
export function setupControllers(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  interactive: THREE.Object3D[],
  protoboard: THREE.Object3D,
  workbench: THREE.Object3D,
) {
  const raycaster = new THREE.Raycaster();
  const tempMatrix = new THREE.Matrix4();
  const modelFactory = new XRControllerModelFactory();

  const rayGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1),
  ]);
  const rayLine = new THREE.Line(
    rayGeometry,
    new THREE.LineBasicMaterial({ color: 0x4f7cff }),
  );
  rayLine.scale.z = 3;

  const controllers: THREE.XRTargetRaySpace[] = [];
  const rayLines: THREE.Line[] = [];
  const raycastTargets = [...interactive, workbench];
  const selected = new Map<THREE.XRTargetRaySpace, THREE.Object3D>();

  for (let i = 0; i < 2; i++) {
    const controller = renderer.xr.getController(i);
    const controllerRay = rayLine.clone();
    controller.add(controllerRay);
    scene.add(controller);

    controller.addEventListener('selectstart', () => onSelectStart(controller));
    controller.addEventListener('selectend', () => onSelectEnd(controller));
    controllers.push(controller);
    rayLines.push(controllerRay);

    const grip = renderer.xr.getControllerGrip(i);
    grip.add(modelFactory.createControllerModel(grip));
    scene.add(grip);
  }

  /**
   * Encontra a raiz interativa de um objeto filho (ex: se o raio acertar a perna do LED,
   * retorna o grupo completo do LED registrado em `interactive`).
   */
  function getInteractiveRoot(object: THREE.Object3D | null): THREE.Object3D | null {
    let curr = object;
    while (curr && !interactive.includes(curr)) {
      curr = curr.parent;
    }
    return curr;
  }

  function intersect(controller: THREE.XRTargetRaySpace): THREE.Object3D | null {
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

    // recursive = true para detectar partes filhas de grupos
    const hits = raycaster.intersectObjects(interactive, true);
    if (hits.length > 0) {
      return getInteractiveRoot(hits[0].object);
    }
    return null;
  }

  function isJumperWire(object: THREE.Object3D): boolean {
    return object.name === 'Fio Jumper';
  }

  function isOverProtoboard(controller: THREE.XRTargetRaySpace): boolean {
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    return raycaster.intersectObject(protoboard, true).length > 0;
  }

  function onSelectStart(controller: THREE.XRTargetRaySpace): void {
    const target = intersect(controller);
    if (target) {
      // Reparenting: transfere o nó do 'scene' para a mão 'controller'
      controller.attach(target);
      selected.set(controller, target);
    }
  }

  function onSelectEnd(controller: THREE.XRTargetRaySpace): void {
    const obj = selected.get(controller);
    if (obj) {
      if (isJumperWire(obj) && isOverProtoboard(controller)) {
        protoboard.attach(obj);
      } else {
        // Reparenting de retorno: devolve o nó para o espaço do mundo 'scene'
        scene.attach(obj);
      }
      selected.delete(controller);
    }
  }

  return {
    /** Realça os materiais sob a mira de cada controller */
    update(): void {
      for (const { material, originalColor } of highlightReset) {
        material.emissive.setHex(originalColor);
      }
      highlightReset.length = 0;

      for (const controller of controllers) {
        const ray = rayLines[controllers.indexOf(controller)];
        if (selected.has(controller)) {
          ray.scale.z = 3;
          continue;
        }
        const target = intersect(controller);
        const hitDistance = raycaster.intersectObjects(raycastTargets, true)[0]?.distance ?? 3;
        ray.scale.z = Math.min(hitDistance, 3);
        if (target) {
          target.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              const mat = mesh.material as THREE.MeshStandardMaterial;
              if (mat && 'emissive' in mat) {
                highlightReset.push({ material: mat, originalColor: mat.emissive.getHex() });
                mat.emissive.setHex(0x334466);
              }
            }
          });
        }
      }
    },
  };
}

interface HighlightEntry {
  material: THREE.MeshStandardMaterial;
  originalColor: number;
}
const highlightReset: HighlightEntry[] = [];
