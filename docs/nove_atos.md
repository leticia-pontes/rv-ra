# Um Arquivo, Nove Atos: O Fio da Execução

> **Documento de Leitura Conceitual**  
> *Este arquivo não foi feito para ser executado diretamente.* O código real do projeto está distribuído em módulos especializados (`src/main.ts`, `src/scene.ts`, `src/controllers.ts`, etc.).  
> Aqui, o código é apresentado na **ordem cronológica exata de execução**, revelando a vida da aplicação: do nascimento do palco e montagem do **Grafo de Cena** até o laço contínuo do **Render Loop** e a mutação de nós com o **Reparenting**.

---

## Sumário dos Nove Atos

1. **Ato 1: O Palco e o Motor** — Inicialização do `WebGLRenderer` e ativação do subsistema WebXR.
2. **Ato 2: O Olho no Espaço** — Criação da raiz do Grafo de Cena (`Scene`) e posicionamento da Câmera.
3. **Ato 3: A Luz e a Bancada** — Povoamento inicial da árvore com iluminação e a mesa de suporte.
4. **Ato 4: Os Componentes na Árvore** — A Protoboard fixa e os componentes móveis (LEDs, Fios, Resistores) no Grafo.
5. **Ato 5: Os Órgãos de Sentido** — Configuração dos controles XR, raios de mira e escuta de eventos.
6. **Ato 6: A Partida do Laço** — Conexão do relógio e partida do loop com `setAnimationLoop`.
7. **Ato 7: O Batimento Cardíaco** — O ciclo contínuo a cada quadro (delta, mira e intersecções).
8. **Ato 8: O Disparo para a GPU** — Resolução recursiva de matrizes mundiais e renderização da cena.
9. **Ato 9: O Clímax: O Reparenting** — O clique/gatilho que transfere nós entre pais no grafo de cena.

---

```typescript
// ============================================================================
// ATO 1: O PALCO E O MOTOR (Origem: src/main.ts)
// Assunto: Laço de Renderização (Preparação do pipeline WebGL/WebXR)
// ============================================================================

// 1.1 Recuperamos os nós do DOM que receberão o canvas e relatórios de capacidades.
const container = document.getElementById('app') as HTMLDivElement;
const report = document.getElementById('capability-report') as HTMLElement;

// 1.2 Instanciamos o motor WebGL com antialiasing e suporte a canal alfa.
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// 1.3 PONTO CRÍTICO: Avisamos o Three.js que a taxa de quadros e o ciclo
// de exibição serão governados pela API WebXR (óculos VR/AR ou tela).
renderer.xr.enabled = true;

// 1.4 Inserimos o elemento <canvas> gerado no DOM da página.
container.appendChild(renderer.domElement);


// ============================================================================
// ATO 2: O OLHO NO ESPAÇO (Origem: src/scene.ts -> constructor)
// Assunto: Grafo de Cena (A Raiz da Árvore e o Ponto de Vista)
// ============================================================================

// 2.1 Nasce o nó raiz do Grafo de Cena. Tudo que existir no mundo 3D será
// descendente direto ou indireto deste objeto.
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111318);

// 2.2 Criamos a câmera de perspectiva (campo de visão 60°, aspect ratio, planos near/far).
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.01,
  50
);

// 2.3 Posicionamos o observador ergonomicamente em frente à mesa (altura média dos olhos: 1.45m).
// No grafo de cena, a câmera possui sua própria matriz de transformação local.
camera.position.set(0, 1.45, 0.45);


// ============================================================================
// ATO 3: A LUZ E A BANCADA (Origem: src/scene.ts -> addLights, addWorkbench)
// Assunto: Grafo de Cena (Filhos Estáticos e Iluminação)
// ============================================================================

// 3.1 Luz hemisférica (céu e solo): espalha iluminação ambiente suave sobre a área.
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x333945, 1.2);
hemiLight.position.set(0, 2, 0);
scene.add(hemiLight); // Grafo: scene -> hemiLight

// 3.2 Luz direcional (sol virtual): produz sombras e relevo nos componentes.
const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
dirLight.position.set(0.8, 2.5, 0.8);
scene.add(dirLight); // Grafo: scene -> dirLight

// 3.3 A Bancada de trabalho (mesa de 1.2m x 0.7m e bandejas laterais).
// Estes objetos compõem a referência espacial estática onde os itens serão montados.
const table = new THREE.Mesh(
  new THREE.BoxGeometry(1.2, 0.04, 0.7),
  new THREE.MeshStandardMaterial({ color: 0x22262e, roughness: 0.6 })
);
table.position.set(0, 0.98, -0.5);
scene.add(table); // Grafo: scene -> table


// ============================================================================
// ATO 4: OS COMPONENTES NA ÁRVORE (Origem: src/scene.ts -> addProtoboard, addCircuitComponents)
// Assunto: Grafo de Cena (Nós Fixos vs. Grupos Móveis Interativos)
// ============================================================================

// 4.1 A Protoboard (16.5cm x 5.5cm) repousa sobre a bancada.
// Ela é estática: fica em `scene`, mas NÃO entra na lista `interactive` (não pode ser arrastada).
const protoboard = new THREE.Mesh(
  new THREE.BoxGeometry(0.165, 0.012, 0.055),
  new THREE.MeshStandardMaterial({ color: 0xedebe6, roughness: 0.5 })
);
protoboard.position.set(0, 1.008, -0.5);
scene.add(protoboard); // Grafo: scene -> protoboard

// 4.2 Lista de atores interativos (itens que os controllers ou o mouse podem mover):
const interactive: THREE.Object3D[] = [];

// 4.3 LED (Objeto Composto montado como uma subárvore THREE.Group):
// Grafo: ledGroup -> [cúpula translúcida, corpo cilíndrico, pino1 metálico, pino2 metálico]
const ledGroup = new THREE.Group();
const ledBulb = new THREE.Mesh(
  new THREE.SphereGeometry(0.005, 16, 12),
  new THREE.MeshStandardMaterial({ color: 0xff2222, roughness: 0.25, transparent: true, opacity: 0.85 })
);
ledBulb.position.y = 0.012;
ledGroup.add(ledBulb);

const pinMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9 });
const pin1 = new THREE.Mesh(new THREE.CylinderGeometry(0.0006, 0.0006, 0.014), pinMat);
pin1.position.set(-0.002, -0.003, 0);
ledGroup.add(pin1);

// Posicionamos o LED na bandeja da direita e o tornamos interativo:
ledGroup.position.set(0.24, 1.018, -0.54);
scene.add(ledGroup);
interactive.push(ledGroup); // <-- Habilitado para apanhar, mover e encaixar!

// 4.4 Fio Jumper maleável (curva tubular em arco):
// Grafo: wireGroup -> [malha do tubo, terminais metálicos de inserção]
const wireCurve = new THREE.CubicBezierCurve3(
  new THREE.Vector3(-0.022, 0, 0),
  new THREE.Vector3(-0.022, 0.035, 0),
  new THREE.Vector3(0.022, 0.035, 0),
  new THREE.Vector3(0.022, 0, 0)
);
const wireMesh = new THREE.Mesh(
  new THREE.TubeGeometry(wireCurve, 24, 0.0016, 8, false),
  new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.4 })
);
const wireGroup = new THREE.Group();
wireGroup.add(wireMesh);
wireGroup.position.set(-0.25, 1.018, -0.54);
scene.add(wireGroup);
interactive.push(wireGroup); // <-- Também é adicionado aos interativos


// ============================================================================
// ATO 5: OS ÓRGÃOS DE SENTIDO (Origem: src/controllers.ts -> setupControllers)
// Assunto: Grafo de Cena e Interação (Nós de Entrada e Listeners)
// ============================================================================

// 5.1 Geometria e material para a linha do raio de mira que sai da mão do usuário.
const raycaster = new THREE.Raycaster();
const tempMatrix = new THREE.Matrix4();
const rayGeometry = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0, 0, -1),
]);
const rayLine = new THREE.Line(
  rayGeometry,
  new THREE.LineBasicMaterial({ color: 0x4f7cff })
);
rayLine.scale.z = 3;

const controllers: THREE.XRTargetRaySpace[] = [];
const selected = new Map<THREE.XRTargetRaySpace, THREE.Object3D>();

// 5.2 Para as duas mãos (0 e 1):
for (let i = 0; i < 2; i++) {
  // getController(i) cria um nó 3D cujas transformações
  // são alimentadas em tempo real pelo headset VR via WebXR.
  const controller = renderer.xr.getController(i);

  // O raio laser é tornado FILHO do controle (move-se junto dele automaticamente!)
  controller.add(rayLine.clone()); // Grafo: controller -> rayLine
  scene.add(controller);           // Grafo: scene -> controller

  // Registramos os gatilhos para apanhar (selectstart) e soltar (selectend)
  controller.addEventListener('selectstart', () => onSelectStart(controller));
  controller.addEventListener('selectend', () => onSelectEnd(controller));
  controllers.push(controller);

  // O grip é o modelo visual 3D do controle físico ou mão
  const grip = renderer.xr.getControllerGrip(i);
  scene.add(grip);                 // Grafo: scene -> grip
}


// ============================================================================
// ATO 6: A PARTIDA DO LAÇO (Origem: src/main.ts)
// Assunto: Laço de Renderização (O Motor em Marcha Contínua)
// ============================================================================

// 6.1 Relógio para medição de delta time.
const clock = new THREE.Clock();

// 6.2 setAnimationLoop substitui o requestAnimationFrame clássico da web.
// Em WebXR, é ele que sincroniza com os displays dos óculos a 72Hz, 90Hz ou 120Hz.
renderer.setAnimationLoop((_timestamp, frame) => {
  // A partir daqui entramos no ciclo perpétuo: Atos 7 e 8 repetem-se a cada quadro!
  
  const delta = clock.getDelta();

  // ==========================================================================
  // ATO 7: O BATIMENTO CARDÍACO (Origem: src/controllers.ts update)
  // Assunto: Laço de Renderização e Mira (Raycasting Contínuo)
  // ==========================================================================

  // Limpa realces anteriores:
  for (const item of highlightReset) item.material.emissive.setHex(item.originalColor);
  highlightReset.length = 0;

  // Para cada controle, verifica se o raio intercepta algum componente interativo:
  for (const controller of controllers) {
    if (selected.has(controller)) continue; // Se já está segurando algo, ignora
    
    // Intersecção matemática entre o vetor do controle e os nós da cena:
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

    // `recursive = true` permite que o raio detecte partes filhas dos grupos de componentes
    const hits = raycaster.intersectObjects(interactive, true);

    if (hits.length > 0) {
      // Localiza o nó raiz do componente interativo no grafo
      const target = getInteractiveRoot(hits[0].object);
      if (target) {
        // Realça visualmente todas as malhas do componente apontado (glow suave)
        target.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.isMesh) {
            const mat = mesh.material as THREE.MeshStandardMaterial;
            if (mat && 'emissive' in mat) {
              highlightReset.push({ material: mat, originalColor: mat.emissive.getHex() });
              mat.emissive.setHex(0x334466);
            }
          }
        });
      }
    }
  }

  // ==========================================================================
  // ATO 8: O DISPARO PARA A GPU (Origem: src/main.ts -> render)
  // Assunto: Grafo de Cena e Renderizador
  // ==========================================================================

  // O Three.js percorre recursivamente todo o Grafo de Cena:
  // 1. Calcula `object.matrixWorld = parent.matrixWorld * object.matrix`
  // 2. Realiza o frustum culling (descarta objetos fora do campo de visão)
  // 3. Envia matrizes, vértices, materiais e luzes para a GPU desenhar no framebuffer.
  renderer.render(scene, camera);
});

const highlightReset: { material: THREE.MeshStandardMaterial; originalColor: number }[] = [];


// ============================================================================
// ATO 9: O CLÍMAX: O REPARENTING (Origem: src/controllers.ts)
// Assunto: Grafo de Cena (Mutação de Paternidade em Tempo de Execução)
// ============================================================================

/**
 * Encontra o grupo registrado em `interactive` ao qual uma malha filha pertence.
 */
function getInteractiveRoot(object: THREE.Object3D | null): THREE.Object3D | null {
  let curr = object;
  while (curr && !interactive.includes(curr)) {
    curr = curr.parent;
  }
  return curr;
}

/**
 * Quando o usuário aperta o gatilho:
 * O componente sai do nó raiz 'scene' e passa a ser filho do 'controller'.
 */
function onSelectStart(controller: THREE.XRTargetRaySpace): void {
  // 9.1 Localiza o componente sob o raio
  tempMatrix.identity().extractRotation(controller.matrixWorld);
  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
  const hits = raycaster.intersectObjects(interactive, true);

  if (hits.length > 0) {
    const target = getInteractiveRoot(hits[0].object);
    if (target) {
      // 9.2 O CORAÇÃO DO GRAFO: REPARENTING COM .attach()
      // O Three.js faz: scene.remove(target) + controller.add(target),
      // MAS recalculando a posição local para que o componente NÃO SALTE!
      //
      // ANTES:  scene (raiz) ---> ledGroup (na mesa)
      // DEPOIS: scene (raiz) ---> controller ---> ledGroup (na mão do usuário)
      controller.attach(target);

      selected.set(controller, target);
    }
  }
}

/**
 * Quando o usuário solta o gatilho:
 * O componente é desanexado da mão e devolvido à raiz do grafo de cena.
 */
function onSelectEnd(controller: THREE.XRTargetRaySpace): void {
  const obj = selected.get(controller);
  if (obj) {
    // 9.3 REPARENTING DE RETORNO:
    // controller.remove(obj) + scene.add(obj),
    // mantendo o componente exatamente onde a mão o soltou sobre a placa ou mesa.
    scene.attach(obj);

    selected.delete(controller);
  }
}
```

---

## Síntese dos Conceitos

| Conceito | Onde brilha no roteiro | O que faz por baixo dos panos |
| :--- | :--- | :--- |
| **Grafo de Cena (Scene Graph)** | Atos 2, 3, 4, 5 e 9 | Estrutura hierárquica em árvore onde nós filhos herdam transformações de seus pais. Ao mover a mão (`controller`), o grupo do LED e todas as suas partes internas acompanham automaticamente. |
| **Grupos Compostos (`THREE.Group`)** | Ato 4 | Reúnem cúpula, corpo e pinos metálicos sob uma mesma raiz local, permitindo tratar um componente eletrônico inteiro como uma única entidade lógica. |
| **Matriz Local vs. Mundial** | Atos 7, 8 e 9 | `matrix` armazena a posição do objeto relativa ao seu pai imediato. `matrixWorld` representa a posição absoluta no espaço 3D global calculada na travessia da árvore. |
| **Reparenting (`attach`)** | Ato 9 | Altera a paternidade de um nó na árvore. O método `.attach()` compensa a matriz do novo pai, garantindo uma transição suave sem saltos espaciais. |
| **Laço de Renderização** | Atos 6, 7 e 8 | Ciclo contínuo de vida que recebe o delta de tempo, recalcula lógica/mira e submete o grafo atualizado aos shaders da GPU quadro a quadro. |
