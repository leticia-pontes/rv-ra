# Medidas do Módulo 03

Números usados nos slides 4, 6 e 7. Todos saem do código deste repositório.

## Troca de pai conferida em números (passo 8, slide 6)

Gerado por `conferirTrocaDePai()` em `src/reparent.ts`. Aparece no console do navegador (F12) ao abrir o ambiente, como `console.table`.

A placa está em (0; 1,008; −0,5), igual a `src/scene.ts`. O fio é solto sobre a placa.

| Caso | Posição no mundo (m) | Posição local (m) | Erro (m) |
| :--- | :--- | :--- | :--- |
| Fio antes, filho de Scene | (0,020; 1,018; −0,490) | (0,020; 1,018; −0,490) | 0 |
| Fio depois, filho da placa | (0,020; 1,018; −0,490) | (0,020; 0,010; 0,010) | 0 |
| Placa +10 cm e 90° em Y | (0,110; 1,018; −0,520) | (0,020; 0,010; 0,010) | — |
| Fronteira: pai girado e escala 2 | (0,110; 1,018; −0,520) | (0,007; −0,110; −0,094) | 2,4 × 10⁻¹⁶ |

- Linha 3: a placa andou e girou, o fio foi junto, e a posição local dele não mudou. Ninguém somou coordenada.
- Linha 4: o erro é arredondamento de ponto flutuante, não deslocamento.
- Calculado com three r185.

## Custo do quadro (passo 9, slide 7)

- Teto declarado: **16,7 ms** por quadro (60 qps), especificação seção 10.
- Indicador: painel dentro da cena, preso à câmera (`src/performance.ts`). Mostra média, qps e pior quadro a cada 0,5 s.
- Mede o tempo de CPU do quadro (update + render). Não mede o tempo da GPU.

| Máquina | Navegador | Regime | Custo médio | qps |
| :--- | :--- | :--- | :--- | :--- |
| PC do Breno: Intel i5-12400F, 16 GB, RTX 3060 8 GB, Windows 11 | Chrome 150 | Tela | 0,51 ms (pior 0,8 ms) | 60 |

## Aparelhos testados

| Aparelho | Regime que abriu | O que não abriu |
| :--- | :--- | :--- |
| PC Windows, Chrome 150, sem emulador | Tela | VR e AR (navegador responde "não suportado") |
| Mesmo PC, Chrome 150 + Immersive Web Emulator (Meta Quest 3 emulado) | Tela, VR e AR | No AR, o toque planta um cilindro de teste, não a placa |
