import * as THREE from 'three';

/**
 * Conferência da troca de pai em NÚMEROS (passo 8), e não a olho.
 *
 * A troca em si é o attach() do Three.js, usado em src/controllers.ts e src/main.ts.
 * A conta que ele faz:  M_local' = (M_mundo do novo pai)^-1 · M_mundo do objeto
 * Como M_mundo = M_pai · M_local', a matriz de mundo do objeto não muda.
 *
 * conferirTrocaDePai() refaz o caso do slide 6 com as coordenadas da cena
 * (placa em (0; 1,008; -0,5), como em src/scene.ts) e devolve a tabela.
 */

export interface LinhaConferencia {
  caso: string;
  mundo: string;
  local: string;
  erroM: number;
}

const fmt = (v: THREE.Vector3) =>
  `(${v.x.toFixed(3)}; ${v.y.toFixed(3)}; ${v.z.toFixed(3)})`;

/** Troca de pai medindo a posição no mundo antes e depois. Devolve o erro em metros. */
export function reparentConferido(obj: THREE.Object3D, novoPai: THREE.Object3D): number {
  const antes = obj.getWorldPosition(new THREE.Vector3());
  novoPai.attach(obj);
  const depois = obj.getWorldPosition(new THREE.Vector3());
  return antes.distanceTo(depois);
}

export function conferirTrocaDePai(): LinhaConferencia[] {
  const linhas: LinhaConferencia[] = [];
  const mundo = new THREE.Vector3();

  const cena = new THREE.Scene();
  const placa = new THREE.Group();
  placa.position.set(0, 1.008, -0.5); // igual a src/scene.ts
  cena.add(placa);

  const fio = new THREE.Group();
  fio.position.set(0.02, 1.018, -0.49); // fio solto sobre a placa
  cena.add(fio);
  cena.updateMatrixWorld(true);

  // 1. Antes: filho da cena
  fio.getWorldPosition(mundo);
  linhas.push({ caso: 'Fio antes, filho de Scene', mundo: fmt(mundo), local: fmt(fio.position), erroM: 0 });

  // 2. Troca de pai: vira filho da placa
  const erro = reparentConferido(fio, placa);
  fio.getWorldPosition(mundo);
  linhas.push({ caso: 'Fio depois, filho da placa', mundo: fmt(mundo), local: fmt(fio.position), erroM: erro });

  // 3. Mover e girar a placa: o fio vai junto, sem somar coordenada à mão
  placa.position.x += 0.1;
  placa.rotation.y = Math.PI / 2;
  cena.updateMatrixWorld(true);
  fio.getWorldPosition(mundo);
  linhas.push({ caso: 'Placa +10 cm e 90° em Y', mundo: fmt(mundo), local: fmt(fio.position), erroM: 0 });

  // 4. Fronteira: novo pai girado e com escala 2
  const paiEscalado = new THREE.Group();
  paiEscalado.position.set(0.3, 1.2, -0.4);
  paiEscalado.rotation.set(0.4, 1.1, -0.3);
  paiEscalado.scale.setScalar(2);
  cena.add(paiEscalado);
  cena.updateMatrixWorld(true);
  const erroFronteira = reparentConferido(fio, paiEscalado);
  fio.getWorldPosition(mundo);
  linhas.push({ caso: 'Fronteira: pai girado e escala 2', mundo: fmt(mundo), local: fmt(fio.position), erroM: erroFronteira });

  return linhas;
}
