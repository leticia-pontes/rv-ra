import * as THREE from 'three';

/**
 * Indicador de custo do quadro, desenhado DENTRO da cena 3D.
 *
 * Decisão: painel em CanvasTexture preso à câmera (filho dela no grafo de cena),
 * para aparecer igual na tela e no visor. Um painel HTML não apareceria no visor.
 *
 * O que mede: tempo de CPU do nosso quadro (update + render), com performance.now().
 * O que NÃO mede: o tempo que a GPU leva para desenhar.
 */

/** Teto declarado na especificação (seção 10): 60 qps = 16,7 ms por quadro. */
export const FRAME_BUDGET_MS = 16.7;

/** De quanto em quanto tempo o painel é redesenhado (segundos). */
const INTERVALO_S = 0.5;

export interface FrameCostStats {
  mediaMs: number;
  piorMs: number;
  qps: number;
}

export function createFrameCostIndicator(camera: THREE.Camera) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  // 16 cm x 4 cm, a 50 cm do olho: cabe no topo da tela e no visor
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.16, 0.04),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthTest: false }),
  );
  panel.name = 'Indicador de custo do quadro';
  panel.position.set(0, 0.22, -0.5);
  panel.renderOrder = 999; // desenha por cima de tudo
  camera.add(panel);

  let inicio = 0;
  let soma = 0;
  let pior = 0;
  let quadros = 0;
  let tempo = 0;
  let ultimo: FrameCostStats = { mediaMs: 0, piorMs: 0, qps: 0 };

  function desenhar(s: FrameCostStats) {
    const estourou = s.mediaMs > FRAME_BUDGET_MS;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(10, 12, 16, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = estourou ? '#ff5c5c' : '#4ade80';
    ctx.font = 'bold 44px monospace';
    ctx.fillText(`${s.mediaMs.toFixed(2)} / ${FRAME_BUDGET_MS} ms`, 20, 56);
    ctx.fillStyle = '#e5e7eb';
    ctx.font = '32px monospace';
    ctx.fillText(`${s.qps.toFixed(0)} qps  ·  pior ${s.piorMs.toFixed(1)} ms`, 20, 106);
    texture.needsUpdate = true;
  }

  desenhar(ultimo);

  return {
    panel,
    /** Chamar no começo do quadro. */
    begin(): void {
      inicio = performance.now();
    },
    /** Chamar depois do render, com o delta do relógio (segundos). */
    end(delta: number): void {
      const custo = performance.now() - inicio;
      soma += custo;
      pior = Math.max(pior, custo);
      quadros++;
      tempo += delta; // agrupa por TEMPO, não por número de quadros
      if (tempo >= INTERVALO_S) {
        ultimo = { mediaMs: soma / quadros, piorMs: pior, qps: quadros / tempo };
        desenhar(ultimo);
        soma = 0;
        pior = 0;
        quadros = 0;
        tempo = 0;
      }
    },
    /** Última medida, para quem quiser ler no console. */
    stats(): FrameCostStats {
      return ultimo;
    },
  };
}
