# RV & RA

Um projeto experimental de **WebXR** (Realidade Virtual e Realidade Aumentada) desenvolvido com **Three.js**, **TypeScript** e **Vite**.

Projeto Integrador do **Grupo 5** (UNIMAR): uma bancada com protoboard em escala 1:1, onde a pessoa pega LEDs, resistor e fios para montar um circuito. O mesmo endereço roda em três regimes: na tela do computador, no visor (VR) e pela câmera do celular (AR).

Integrantes: Caio Ocon, Leticia Alves, Leandro Poletti, Laura Yumi, Breno Colonello.

Documentos:

*   [Especificação](docs/especificacao.md): o que a cena deve ser e o que mudou desde o Módulo 01.
*   [Medidas e aparelhos testados](docs/medidas.md): custo do quadro, troca de pai em números e tabela de aparelhos.
*   [Documentação técnica](docs/documentacao-tecnica.md): o que cada arquivo e função faz.

---

## Funcionalidades

*   **Sonda de capacidades WebXR**:
    *   Consulta real de `inline`, `immersive-vr` e `immersive-ar` com `isSessionSupported`.
    *   Relatório visível no aparelho, sem depender do console.
    *   Inspeção dos recursos efetivamente concedidos pela sessão.
    *   Inventário das fontes de entrada, perfis, lateralidade, grip e hand tracking.
    *   Medição de rastreamento 3DoF/6DoF para o visor e cada entrada.
    *   Estados separados para recurso não suportado, acesso negado e resultado indeterminado.

*   **Virtual Reality (VR) Imersivo**:
    *   Suporte a tracking de controllers 3D.
    *   Sistema de mira/apontamento por raio laser (raycast).
    *   Mecânica de pegar (grab) e soltar (release) e rotacionar objetos usando os gatilhos dos controles.
    *   Efeito de realce (emissivo) ao apontar para objetos interativos.
*   **Augmented Reality (AR) com Hit-Testing**:
    *   Detecção de superfícies reais em tempo real (chão, mesas, etc.).
    *   Retículo de mira (cursor 3D) projetado sobre as superfícies detectadas.
    *   Interação por toque na tela para plantar um objeto de teste (cilindro) no mundo real. A placa ainda não é ancorada.
*   **Modo Desktop (Fallback)**:
    *   Visualização 3D convencional no navegador quando fora de dispositivos XR.
    *   Navegação orbital intuitiva via mouse (OrbitControls).
    *   Clique e arraste para mover as peças sobre a mesa. Peça solta sobre a protoboard fica presa nela e anda junto com a placa.
    *   Botão direito + arrastar sobre uma peça para girá-la em torno do eixo vertical.
*   **Cena como árvore (grafo de cena)**:
    *   Cada peça é um `THREE.Group` com suas partes como filhas, mais uma área de seleção invisível que facilita acertar peças pequenas.
    *   Troca de pai com `attach()`, preservando a posição no mundo. A conferência em números aparece no console (F12) ao abrir o ambiente.
*   **Indicador de custo do quadro**:
    *   Painel dentro da cena, preso à câmera, com custo médio do quadro contra o teto de 16,7 ms, qps e pior quadro.
*   **Contexto Seguro Automático (HTTPS)**:
    *   Configuração com `@vitejs/plugin-basic-ssl` para expor o servidor de desenvolvimento em HTTPS automaticamente.
    *   *Obrigatório para que as APIs do WebXR funcionem em dispositivos da rede local.*

---

## Tecnologias Utilizadas

*   **[Three.js (r185+)](https://threejs.org/)** – Motor 3D de alta performance para a Web.
*   **[TypeScript](https://www.typescriptlang.org/)** – Tipagem estática para maior previsibilidade e segurança no código.
*   **[Vite](https://vite.dev/)** – Bundler extremamente rápido e servidor de desenvolvimento otimizado.
*   **[@vitejs/plugin-basic-ssl](https://github.com/vitejs/vite-plugin-basic-ssl)** – Geração automática de certificados SSL autoassinados para teste de WebXR via rede local.

---

## Estrutura de Arquivos

```text
rv-ra/
├── .nvmrc              # Versão recomendada do Node.js (v24.15.0)
├── index.html          # Página principal e container do app
├── package.json        # Dependências e scripts npm
├── tsconfig.json       # Configurações do compilador TypeScript
├── vite.config.ts      # Configurações do Vite (porta, HTTPS, host público)
├── docs/
│   ├── especificacao.md         # Especificação e registro de decisões
│   ├── medidas.md               # Custo do quadro, troca de pai e aparelhos testados
│   ├── documentacao-tecnica.md  # Explicação de cada arquivo
│   └── nove_atos.md             # Leitura conceitual da ordem de execução
├── public/
│   └── models/
│       └── cubone.glb  # Sobra do modelo inicial, não é usado pela cena
└── src/
    ├── main.ts         # Ponto de entrada, loop de renderização e inicialização WebXR
    ├── capabilities.ts # Sonda, estrutura do relatório e interface visível
    ├── scene.ts        # Cena, luzes, bancada, protoboard e componentes
    ├── controllers.ts  # Controles VR (raio, pegar e soltar)
    ├── ar.ts           # Lógica de AR e hit-testing (posicionamento na superfície)
    ├── performance.ts  # Indicador de custo do quadro dentro da cena
    ├── reparent.ts     # Conferência da troca de pai em números
    ├── theme.ts        # Tema claro/escuro e painel recolhível
    └── vite-env.d.ts   # Declaração de tipos específicos do Vite e WebXR
```

---

## Como Executar o Projeto

### Pré-requisitos
*   **Node.js** (versão mínima recomendada no [.nvmrc](file:///.nvmrc): `v24.15.0`)
*   **NPM** ou gerenciador de pacotes equivalente.

### 1. Instalar as dependências
```bash
npm install
```

> **Windows (PowerShell):** se aparecer o erro "a execução de scripts foi desabilitada neste sistema", use `npm.cmd` no lugar de `npm` (ex.: `npm.cmd install` e `npm.cmd run dev`).

### 2. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```

O console exibirá os endereços locais. Como o `host: true` está ativado no Vite, você verá algo como:
*   Local: `https://localhost:5173/`
*   Rede Local (Network): `https://192.168.x.x:5173/`

### 3. Build de produção
Para gerar os arquivos estáticos compilados para deploy:
```bash
npm run build
```
O resultado será gerado na pasta `dist/`.

---

## Como Testar em Dispositivos WebXR

As especificações do WebXR exigem uma **conexão segura (HTTPS)** para habilitar os modos imersivos, exceto em `localhost`.  

Para testar no seu headset VR (Meta Quest) ou smartphone (AR):

1.  Certifique-se de que o dispositivo móvel/Quest está conectado na **mesma rede Wi-Fi** do computador que está rodando o projeto.
2.  Abra o navegador do dispositivo (ex: Oculus Browser no Quest, ou Chrome no Android) e digite o endereço de **Rede Local (Network)** exibido pelo terminal do Vite (ex: `https://192.168.1.50:5173`).
3.  **Aviso de Certificado (SSL Autoassinado)**:
    *   Como o certificado de desenvolvimento é autoassinado pelo plugin do Vite, o seu navegador mostrará um aviso de segurança ("Sua conexão não é privada").
    *   **Solução**: Clique em **"Avançado"** (Advanced) e depois em **"Ir para [endereço da rede] (não seguro)"** (Proceed to ...).
4.  Abra o painel da esquerda (botão `>` no canto superior) e use os botões do relatório:
    *   **Testar VR**: se estiver usando um óculos de realidade virtual.
    *   **Testar AR**: se estiver usando um celular com suporte a Realidade Aumentada.
    *   Os botões ficam desativados quando o aparelho responde que não suporta aquele modo.

Sem óculos, dá para testar VR e AR no Chrome do computador com a extensão **Immersive Web Emulator** (Meta Quest 3 emulado). Depois de instalar, recarregue a página com o DevTools (F12) aberto.

---

## Aparelhos testados

| Aparelho | Regime que abriu | O que não abriu |
| :--- | :--- | :--- |
| PC Windows, Chrome 150, sem emulador | Tela | VR e AR (o navegador responde "não suportado") |
| Mesmo PC, Chrome 150 + Immersive Web Emulator (Meta Quest 3 emulado) | Tela, VR e AR | No AR, o toque planta um cilindro de teste, não a placa |

Custo do quadro medido: **0,51 ms** (pior 0,8 ms) de um teto de **16,7 ms**, a 60 qps, no regime de tela, em um PC com Intel i5-12400F, 16 GB, RTX 3060, Windows 11 e Chrome 150. Detalhes em [docs/medidas.md](docs/medidas.md).
