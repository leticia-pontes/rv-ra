import * as THREE from 'three';

/**
 * Encapsula a cena, iluminação e os objetos de circuito eletrônico:
 * - Mesa de laboratório e protoboard (estáticos)
 * - LEDs, Jumpers (fios) e Resistores (interativos e reposicionáveis)
 */
export class XRScene {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly interactive: THREE.Object3D[] = [];

  constructor() {
    this.scene.background = new THREE.Color(0x111318);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.01,
      50,
    );
    // Posição ergonômica em frente à mesa (altura dos olhos a ~1.45m)
    this.camera.position.set(0, 1.45, 0.45);

    this.addLights();
    this.addFloor();
    this.addWorkbench();
    this.addProtoboard();
    this.addCircuitComponents();
  }

  private addLights(): void {
    const hemi = new THREE.HemisphereLight(0xffffff, 0x333945, 1.2);
    hemi.position.set(0, 2, 0);
    this.scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 1.8);
    dir.position.set(0.8, 2.5, 0.8);
    dir.castShadow = true;
    this.scene.add(dir);

    // Luz pontual suave logo acima da bancada para realçar componentes
    const spot = new THREE.PointLight(0xfffaed, 0.8, 3);
    spot.position.set(0, 1.6, -0.4);
    this.scene.add(spot);
  }

  private addFloor(): void {
    const grid = new THREE.GridHelper(10, 20, 0x4f7cff, 0x1f2330);
    grid.position.y = 0;
    this.scene.add(grid);
  }

  /** Bancada de trabalho onde a protoboard e peças repousam */
  private addWorkbench(): void {
    const tableGroup = new THREE.Group();

    // Tampo da mesa (1.2m x 0.04m x 0.7m)
    const topGeo = new THREE.BoxGeometry(1.2, 0.04, 0.7);
    const topMat = new THREE.MeshStandardMaterial({
      color: 0x22262e,
      roughness: 0.6,
      metalness: 0.2,
    });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.set(0, 0.98, -0.5);
    tableGroup.add(top);

    // Pernas metálicas da mesa
    const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.96);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x111317, metalness: 0.8 });
    const legOffsets = [
      [-0.55, 0.48, -0.2],
      [0.55, 0.48, -0.2],
      [-0.55, 0.48, -0.8],
      [0.55, 0.48, -0.8],
    ];
    for (const [x, y, z] of legOffsets) {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(x, y, z);
      tableGroup.add(leg);
    }

    // Bandeja esquerda (para fios)
    const trayGeo = new THREE.BoxGeometry(0.18, 0.008, 0.16);
    const trayMat = new THREE.MeshStandardMaterial({ color: 0x1a1d24, roughness: 0.7 });
    const leftTray = new THREE.Mesh(trayGeo, trayMat);
    leftTray.position.set(-0.28, 1.004, -0.5);
    tableGroup.add(leftTray);

    // Bandeja direita (para LEDs e resistores)
    const rightTray = new THREE.Mesh(trayGeo, trayMat);
    rightTray.position.set(0.28, 1.004, -0.5);
    tableGroup.add(rightTray);

    this.scene.add(tableGroup);
  }

  /**
   * Protoboard padrão (16.5cm x 5.5cm x 1cm) conforme a especificação do projeto.
   * Inclui divisão central e faixas de alimentação positiva e negativa.
   */
  private addProtoboard(): void {
    const boardGroup = new THREE.Group();
    boardGroup.position.set(0, 1.008, -0.5);

    // Corpo plástico branco/bege
    const bodyGeo = new THREE.BoxGeometry(0.165, 0.012, 0.055);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xedebe6,
      roughness: 0.5,
      metalness: 0.05,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    boardGroup.add(body);

    // Canaleta central divisória (sulco que separa os dois lados de 5 furos)
    const notchGeo = new THREE.BoxGeometry(0.165, 0.002, 0.004);
    const notchMat = new THREE.MeshStandardMaterial({ color: 0xc4c2bb, roughness: 0.9 });
    const notch = new THREE.Mesh(notchGeo, notchMat);
    notch.position.set(0, 0.0061, 0);
    boardGroup.add(notch);

    // Linhas de polaridade das trilhas de alimentação (+ Vermelho / - Azul)
    const lineGeo = new THREE.BoxGeometry(0.155, 0.001, 0.0015);
    const redMat = new THREE.MeshBasicMaterial({ color: 0xd32f2f });
    const blueMat = new THREE.MeshBasicMaterial({ color: 0x1976d2 });

    // Trilhas de cima e de baixo
    const redLineTop = new THREE.Mesh(lineGeo, redMat);
    redLineTop.position.set(0, 0.0061, -0.024);
    const blueLineTop = new THREE.Mesh(lineGeo, blueMat);
    blueLineTop.position.set(0, 0.0061, -0.021);

    const redLineBottom = new THREE.Mesh(lineGeo, redMat);
    redLineBottom.position.set(0, 0.0061, 0.021);
    const blueLineBottom = new THREE.Mesh(lineGeo, blueMat);
    blueLineBottom.position.set(0, 0.0061, 0.024);

    boardGroup.add(redLineTop, blueLineTop, redLineBottom, blueLineBottom);

    // Grade simplificada dos furos (simulação visual eficiente para não pesar)
    const holeGeo = new THREE.PlaneGeometry(0.0018, 0.0018);
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x222222, side: THREE.DoubleSide });
    // Furos de amostragem ao longo da placa
    for (let x = -0.07; x <= 0.07; x += 0.007) {
      for (const z of [-0.015, -0.008, 0.008, 0.015]) {
        const hole = new THREE.Mesh(holeGeo, holeMat);
        hole.rotation.x = -Math.PI / 2;
        hole.position.set(x, 0.0062, z);
        boardGroup.add(hole);
      }
    }

    this.scene.add(boardGroup);
  }

  /**
   * Cria os componentes eletrônicos (LEDs, Jumpers, Resistores)
   * e os adiciona à lista `interactive` para poderem ser movidos e reparentados.
   */
  private addCircuitComponents(): void {
    // 1. LEDs coloridos (Vermelho, Verde, Amarelo)
    const ledRed = this.createLED(0xff2222, 'LED Vermelho');
    ledRed.position.set(0.24, 1.018, -0.54);
    this.addInteractiveComponent(ledRed);

    const ledGreen = this.createLED(0x22c55e, 'LED Verde');
    ledGreen.position.set(0.28, 1.018, -0.54);
    this.addInteractiveComponent(ledGreen);

    const ledYellow = this.createLED(0xeab308, 'LED Amarelo');
    ledYellow.position.set(0.32, 1.018, -0.54);
    this.addInteractiveComponent(ledYellow);

    // 2. Fios Jumpers maleáveis (curvas tubulares)
    const wireBlue = this.createJumperWire(0x3b82f6, 0.045);
    wireBlue.position.set(-0.25, 1.018, -0.54);
    this.addInteractiveComponent(wireBlue);

    const wireOrange = this.createJumperWire(0xf97316, 0.06);
    wireOrange.position.set(-0.29, 1.018, -0.54);
    this.addInteractiveComponent(wireOrange);

    const wireWhite = this.createJumperWire(0xf1f5f9, 0.035);
    wireWhite.position.set(-0.33, 1.018, -0.54);
    this.addInteractiveComponent(wireWhite);

    // 3. Resistor (corpo com faixas coloridas e terminais)
    const resistor = this.createResistor();
    resistor.position.set(0.28, 1.018, -0.46);
    this.addInteractiveComponent(resistor);
  }

  /** Registra o componente no grafo da cena e no conjunto de interativos */
  private addInteractiveComponent(object: THREE.Object3D): void {
    this.scene.add(object);
    this.interactive.push(object);
  }

  /** Constrói um modelo 3D de LED (cúpula difusa + base + terminais metálicos) */
  private createLED(colorHex: number, name: string): THREE.Group {
    const led = new THREE.Group();
    led.name = name;

    // Cúpula translúcida
    const domeGeo = new THREE.SphereGeometry(0.005, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.25,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
    });
    const dome = new THREE.Mesh(domeGeo, bodyMat);
    dome.position.y = 0.012;
    led.add(dome);

    // Cilindro do corpo do LED
    const cylGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.008, 16);
    const cyl = new THREE.Mesh(cylGeo, bodyMat);
    cyl.position.y = 0.008;
    led.add(cyl);

    // Aba da base plástica do LED
    const rimGeo = new THREE.CylinderGeometry(0.0056, 0.0056, 0.0015, 16);
    const rim = new THREE.Mesh(rimGeo, bodyMat);
    rim.position.y = 0.004;
    led.add(rim);

    // Pinos condutores metálicos (ânodo longo e cátodo curto)
    const pinMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.95,
      roughness: 0.2,
    });
    const pinGeoLong = new THREE.CylinderGeometry(0.0006, 0.0006, 0.014);
    const pin1 = new THREE.Mesh(pinGeoLong, pinMat);
    pin1.position.set(-0.002, -0.003, 0);
    led.add(pin1);

    const pinGeoShort = new THREE.CylinderGeometry(0.0006, 0.0006, 0.011);
    const pin2 = new THREE.Mesh(pinGeoShort, pinMat);
    pin2.position.set(0.002, -0.0045, 0);
    led.add(pin2);

    return led;
  }

  /** Constrói um Jumper/Fio em arco com terminais metálicos de inserção */
  private createJumperWire(colorHex: number, span: number): THREE.Group {
    const wireGroup = new THREE.Group();
    wireGroup.name = 'Fio Jumper';

    const half = span / 2;
    // Curva suave em forma de arco
    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-half, 0, 0),
      new THREE.Vector3(-half, 0.035, 0),
      new THREE.Vector3(half, 0.035, 0),
      new THREE.Vector3(half, 0, 0),
    );

    const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.0016, 8, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.4,
      metalness: 0.1,
    });
    const wireMesh = new THREE.Mesh(tubeGeo, tubeMat);
    wireGroup.add(wireMesh);

    // Ponteiras metálicas de inserção nas duas pontas
    const pinGeo = new THREE.CylinderGeometry(0.0006, 0.0006, 0.008);
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 });

    const pinL = new THREE.Mesh(pinGeo, pinMat);
    pinL.position.set(-half, -0.004, 0);
    const pinR = new THREE.Mesh(pinGeo, pinMat);
    pinR.position.set(half, -0.004, 0);

    wireGroup.add(pinL, pinR);
    return wireGroup;
  }

  /** Constrói um Resistor de precisão com código de cores */
  private createResistor(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'Resistor';

    // Corpo cerâmico
    const bodyGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.015, 12);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd4b595, roughness: 0.6 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.005;
    group.add(body);

    // Faixas de cor (ex: Marrom, Preto, Vermelho, Dourado -> 1k Ohm)
    const bandColors = [0x5c3a21, 0x111111, 0xcc1111, 0xd4af37];
    const bandPositions = [-0.005, -0.002, 0.001, 0.005];
    const bandGeo = new THREE.CylinderGeometry(0.0031, 0.0031, 0.0012, 12);

    bandColors.forEach((color, i) => {
      const bandMat = new THREE.MeshBasicMaterial({ color });
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.rotation.z = Math.PI / 2;
      band.position.set(bandPositions[i], 0.005, 0);
      group.add(band);
    });

    // Terminais metálicos dobrados
    const leadGeo = new THREE.CylinderGeometry(0.0005, 0.0005, 0.012);
    const leadMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9 });

    const leadL = new THREE.Mesh(leadGeo, leadMat);
    leadL.position.set(-0.012, 0, 0);
    const leadR = new THREE.Mesh(leadGeo, leadMat);
    leadR.position.set(0.012, 0, 0);

    group.add(leadL, leadR);
    return group;
  }

  /** Chamado no loop de animação para atualizações dinâmicas se necessário */
  update(_delta: number): void {
    // Espaço aberto para física ou rotação/animações sutis
  }
}
