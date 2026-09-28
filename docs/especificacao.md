# Especificação do Projeto Integrador — Módulo 03

## Bloco A - A cena

### Seção 1. Identificação do grupo e da cena

- **Grupo:** Grupo 5
- **Integrantes:** Caio Ocon, Leticia Alves, Leandro, Laura Yumi, Breno Colonello
- **Cena Escolhida:** Circuito em placa de prototipagem (Protoboard).
- **Descrição:** Uma bancada de laboratório contendo uma protoboard física onde o operador apanha, translada e insere componentes eletrônicos (fios jumpers, resistores e LEDs) para fechar um circuito funcional.
- **Justificativa e Custo:** Esta cena impõe custo elevado de processamento e geometria devido à densidade de orifícios e componentes metálicos repetidos. O grupo assumiu este custo para dominar as técnicas de otimização em grafo de cena, agrupamento hierárquico e renderização em tempo real com controle orçamentário.
- **Armadilha e Solução:** A armadilha é a sobrecarga de Draw Calls gerada por centenas de furos e componentes independentes. A solução no Módulo 03 foi unificar a protoboard e seus furos em geometrias simplificadas e agrupar componentes em nós de subárvore (`THREE.Group`), preparando o terreno para GPU Instancing nos módulos subsequentes.
- **Registro de Decisão Mudada:** No Módulo 01 previa-se importar malhas poligonais externas (.gltf) para os componentes. No Módulo 03, decidiu-se construir 100% dos objetos por código através de geometrias primitivas nativas do Three.js em escala métrica 1:1. **Motivo:** Isolar o teste estrutural do Grafo de Cena e a operação atômica de reparenting sem introduzir custos e falhas de carregamento de arquivos externos, mantendo a geometria crua conforme a diretriz pedagógica deste módulo.

### Seção 2. O que a pessoa faz ali

A pessoa posiciona-se em frente à bancada virtual e observa a protoboard e bandejas organizadoras com componentes eletrônicos. Ela apanha componentes com o cursor/mão, ajusta sua elevação e rotação, e os posiciona sobre os orifícios da placa para encaixe. O ambiente considera a tarefa concluída quando um circuito fechado contínuo é estabelecido entre o barramento positivo (VCC) e o barramento negativo (GND), passando pelo resistor e pelo LED, resultando no acendimento luminoso da peça.

- **O que se faz com as mãos:** O usuário realiza pinça, elevação nos eixos X, Y e Z e rotação de 90 graus dos componentes, transportando-os da bandeja para a placa.
- **O que muda com o visor:** O visor estereoscópico fornece percepção direta de paralaxe e profundidade para julgar a altura dos pinos sobre a placa, reduzindo a tentativa e erro típica de telas 2D.
- **O que a câmera precisa provar:** A cena será ancorada horizontalmente sobre uma mesa física real do laboratório por meio de hit-testing (AR), mantendo a protoboard estável enquanto o usuário caminha ao redor.

### Seção 3. Inventário de objetos

| Objeto | Quantidade | Origem / Construção | Move? | Parentesco no Grafo | Observações Técnicas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Bancada de Laboratório** | 1 | Código (`THREE.BoxGeometry` + `CylinderGeometry`) | Não | Filho de `Scene` | Tampo de 1,20 m x 0,70 m x 0,04 m a 0,98 m do piso com 4 pernas e 2 bandejas organizadoras. |
| **Protoboard** | 1 | Código (`THREE.Group` composto) | Sim | Filho de `Scene` | Base de 16,5 cm x 5,5 cm x 1,2 cm. Pode ser transladada na bancada para comprovar que mover o pai translada seus filhos. |
| **Fios Jumpers** | 3 | Código (`THREE.TubeGeometry` + `CubicBezierCurve3`) | Sim | `Scene` ou `Protoboard` | Fios em arco (Azul 4,5 cm, Laranja 6,0 cm, Branco 3,5 cm) com terminais condutores de 0,8 cm. |
| **LEDs Difusos** | 3 | Código (`THREE.Group` composto) | Sim | `Scene` ou `Protoboard` | Vermelho, Verde e Amarelo (cúpula de 0,5 cm, aba e pinos condutores de 1,4 cm e 1,1 cm). |
| **Resistor** | 1 | Código (`THREE.Group` composto) | Sim | `Scene` ou `Protoboard` | Corpo cerâmico de 1,5 cm x 0,3 cm com código de 4 faixas de cor (1kΩ) e terminais metálicos. |
| **Monitor de Custo 3D** | 1 | Código (`THREE.Group` + `CanvasTexture`) | Não | Filho de `Scene` | Instrumento digital na bancada (18 cm x 11 cm) com taxa de quadros e custo em ms em tempo real. |

### Seção 4. O espaço e as escalas

A cena opera estritamente na escala métrica real (1 unidade no Three.js = 1,00 metro no mundo físico):

- **Protoboard:** 0,165 m de comprimento, 0,055 m de largura e 0,012 m de altura.
- **Bancada:** 1,20 m de largura, 0,70 m de profundidade e altura do tampo a 1,00 m do chão virtual (Y = 1,008 m com a placa).
- **Câmera / Observador:** Posicionada a (X = 0 m, Y = 1,45 m, Z = 0,45 m), simulando a altura ergonômica dos olhos de um adulto sentado ou inclinado em frente à bancada.
- **Componentes:** Pinos metálicos com diâmetro de 1,2 mm (raio de 0,0006 m), cúpula dos LEDs com raio de 5 mm e jumpers com arco de 3,5 cm a 6,0 cm de vão.

---

## Bloco B - As regras

### Seção 5. As ações do usuário

| Ação | O que a pessoa faz | O que o sistema faz | Se não puder |
| :--- | :--- | :--- | :--- |
| **Apontar (Hover)** | Passa o mouse ou mira o raio laser sobre a peça. | Realce visual (cursor vira mãozinha no desktop; material ganha emissivo azul no VR). | Nenhum realce visual ocorre. |
| **Apanhar (Grab)** | Clica e segura o botão esquerdo (desktop) ou aperta o gatilho (VR). | O objeto se desanexa de seu pai anterior (`.attach()` para a cena/controlador) e eleva 2,5 cm no Y. | Peça travada ou fora de alcance não se move. |
| **Transladar (X/Z)** | Arrasta o mouse sobre a tela ou move o controle no espaço. | O objeto acompanha o deslocamento horizontal mantendo a altura Y configurada. | Posição é limitada ao volume visível da bancada. |
| **Ajustar Altura (Y)** | Gira a roda do mouse (Scroll) ou segura `Shift` + arrasto vertical, ou teclas `W`/`S`. | O objeto sobe ou desce no eixo Y na faixa de 1,00 m a 1,40 m. | Altura é travada nos limites inferior (mesa) e superior. |
| **Rotacionar** | Pressiona a tecla `R` no teclado (ou move pulso no VR). | O objeto gira 90 graus em torno do eixo Y local. | Sem efeito se nenhum objeto estiver selecionado. |
| **Encaixar / Soltar** | Solta o botão do mouse ou gatilho sobre a protoboard. | O objeto troca de pai para a `Protoboard` via reparenting atômico (`.attach()`) e assenta nos furos (Y local = 0,009 m). | Se solto fora da placa, é reparentado para a `Scene` e repousa no tampo da mesa (Y = 1,018 m). |

### Seção 6. A tarefa e sua validação

- **Estado Inicial:** Bancada com protoboard vazia e peças organizadas nas bandejas laterais (LEDs e resistores à direita, fios à esquerda).
- **Estado Final:** Circuito elétrico contínuo fechado entre a trilha positiva (VCC) e a trilha de terra (GND), contendo pelo menos um fio jumper, um resistor e um LED inseridos nos barramentos correspondentes, resultando na ativação emissiva do LED.
- **Validação:** Validação estrutural de nós de circuito via percurso em grafo topológico a cada operação de encaixe bem-sucedida.

### Seção 7. Regras de encaixe e tolerâncias

Para assegurar usabilidade sem exigir microprecisão milimétrica:

- **Folga de posição horizontal:** Tolerância de captura de até 10,0 cm no eixo longitudinal (X) e 4,5 cm no eixo transversal (Z) a partir do centro da protoboard. Ao soltar a peça dentro desta zona, o sistema realiza o encaixe automático.
- **Folga de altura vertical:** O encaixe é aceito se o componente estiver entre -4,0 cm e +20,0 cm da superfície da placa no momento da soltura.
- **Snap de assentamento:** Ao encaixar, o Y local do componente é ajustado atomicamente para `0,009 m`, garantindo alinhamento visual com a furação plástica.

### Seção 8. Retorno ao usuário

- **Objeto sob a mira:** Cursor `grab` no desktop e emissivo suave azulino (`0x334466`) nas malhas sob o laser no VR.
- **Objeto apanhado:** Elevação imediata de +2,5 cm no Y e cursor `grabbing`.
- **Encaixe na protoboard:** Reparenting atômico registrado no console e no HUD de tela, com atualização imediata da contagem de nós filhos da placa.
- **Sucesso do circuito:** O material da cúpula do LED altera sua cor emissiva para brilho intenso com ativação de ponto de luz local.

---

## Bloco C - A máquina

### Seção 9. Os três regimes

> **Declaração do Estado Atual (Módulo 03):** O regime **Na tela (inline)** é o **único plenamente funcional neste ponto do percurso e roda sem equipamento adicional em qualquer computador convencional**. Os regimes **No visor (VR)** e **Pela câmera (AR)** contam com a sonda de capacidades de hardware ativa (`src/capabilities.ts`) e infraestrutura de controladores e hit-test preparados, constituindo metas de entrega para os blocos posteriores quando o hardware for disponibilizado.

| Aspecto | Na tela (Inline) — **Ativo** | No visor (Immersive VR) — *Em preparação* | Pela câmera (Immersive AR) — *Em preparação* |
| :--- | :--- | :--- | :--- |
| **Mundo do Observador** | **Apresenta a cena numa janela sem tocá-lo.** Não altera o ambiente físico de quem assiste. | **Substitui o mundo físico por inteiro** por um laboratório tridimensional imersivo. | **Mantém o mundo real e deposita objetos sobre ele** (superfície da mesa do mundo real). |
| **Espaço de Referência** | Espaço Euclidiano local de janela WebGL (câmera de projeção em perspectiva). | `local-floor` (origem no solo da sala física, 6 graus de liberdade). | `local-floor` com `viewer` como espaço de referência para hit-testing. |
| **O que é Rastreamento** | Coordenadas 2D do ponteiro do mouse e orientação esférica da câmera (OrbitControls). | Posição e orientação absoluta 6DoF da cabeça (HMD) e dos dois controladores manuais. | Posição e pose 6DoF da câmera do smartphone e raios de projeção contra o chão/mesa. |
| **Contra o que Registra** | Registrado contra o canvas HTML na janela do navegador. | Registrado contra o espaço de rastreamento do chão da sala física. | Registrado contra os planos físicos horizontais reais detectados via hit-test da câmera. |
| **Equipamento Necessário** | **Nenhum.** Qualquer computador com navegador web moderno. | Headset de Realidade Virtual com controles (Meta Quest / PCVR). | Smartphone compatível com ARCore/WebXR com câmera ativa. |

### Seção 10. Orçamento e desempenho

- **Teto Orçamentário Declarado:** **16,67 ms por quadro** (taxa constante de 60 quadros por segundo em regime de tela).
- **Avanço contra o Relógio:** O avanço da cena e da física não é atrelado à contagem de quadros (`frames`), mas sim ao delta de tempo real medido a cada iteração via `THREE.Clock.getDelta()`. Dispositivos mais rápidos ou mais lentos avançam a simulação na mesma velocidade temporal.
- **Indicador Visível na Cena:** Implementado em duas frentes complementares:
  1. **HUD de Tela em Tempo Real (`#scene-cost-indicator`):** Exibe FPS, tempo de quadro em ms, status ("DENTRO DO TETO" vs "ACIMA DO TETO"), Draw Calls e Triângulos da GPU.
  2. **Monitor Físico 3D no Laboratório (`MonitorCustoQuadro3D`):** Um instrumento digital modelado na bancada com `CanvasTexture` atualizada a cada quarto de segundo.
- **Ordem de Degradação:** Caso o custo ultrapasse 20,0 ms por mais de 60 quadros consecutivos:
  1. Desativar sombras dinâmicas da luz direcional (`dirLight.castShadow = false`);
  2. Reduzir a taxa de atualização do display 3D de diagnóstico;
  3. Desativar o antialiasing do WebGLRenderer.

### Seção 11. Erros, limites e degradação

- **WebXR não disponível:** Se o navegador não suportar a API WebXR, a sonda de capacidades acusa o estado `"não suportado"`, oculta os botões de sessão imersiva e mantém o regime de tela perfeitamente ativo e navegável.
- **Permissão de Câmera/VR negada:** O erro `NotAllowedError` é capturado e classificado separadamente como `"negado"` pela sonda, sem travar a aplicação nem causar erro silencioso.
- **Peça solta fora do alcance:** Peças soltas longe da protoboard permanecem repousadas no tampo ou bandejas da bancada, sem sofrer perdas ou comportamentos instáveis.

---

## Bloco D - O trabalho

### Seção 12. Ativos, formatos e licenças

> **Atualização do Módulo 03:** Todos os ativos visuais presentes no estado atual da entrega foram construídos proceduralmente em código pelo grupo utilizando primitivas do Three.js, com custo zero de carregamento externo e domínio público integral.

| Ativo | Formato / Tipo | Origem | Licença | Finalidade |
| :--- | :--- | :--- | :--- | :--- |
| **Bancada e Bandejas** | Geometrias procedurais (`BoxGeometry`, `CylinderGeometry`) | Código próprio (`src/scene.ts`) | Autoria própria | Suporte físico da cena. |
| **Protoboard Estrutural** | Malhas agrupadas em `THREE.Group` | Código próprio (`src/scene.ts`) | Autoria própria | Base e barramento de alimentação. |
| **Fios Jumpers, LEDs e Resistores** | Tubos de Bézier, cilindros e esferas | Código próprio (`src/scene.ts`) | Autoria própria | Componentes de circuito móveis. |
| **Monitor Digital 3D** | Caixa plástica + `CanvasTexture` dinâmico | Código próprio (`src/performance.ts`) | Autoria própria | Indicador de custo dentro do mundo virtual. |
| **Tipografia Digital** | Web Fonts do sistema (monospace / sans-serif) | CSS nativo | Livre | Renderização dos números de diagnóstico. |

### Seção 13. Plano de construção por blocos

- **Bloco 1 (Concluído - Módulo 01):** Especificação formal, definição do domínio da protoboard e declaração dos três regimes.
- **Bloco 2 (Concluído - Módulo 02):** Sonda de capacidades WebXR e relatório visível de hardware e permissões.
- **Bloco 3 (Concluído - Módulo 03):** Construção da cena como Grafo de Cena hierárquico, parentesco por razão de projeto (jumper filho da protoboard), reparenting atômico com preservação matemática de posição mundial, laço temporal contra o relógio e indicador de custo de quadro visível.
- **Bloco 4 (Próximo - Módulo 04):** Modelagem e substituição progressiva por malhas poligonais e texturas PBR, introdução da lógica de circuitos e fechamento da tarefa.

### Seção 14. Riscos, decisões em aberto e declarações

- **Riscos Identificados:** Acúmulo de Draw Calls com a inserção de dezenas de pinos metálicos nos próximos módulos. **Mitigação:** Agrupamento em `InstancedMesh` assim que a malha final dos pinos for modelada.
- **Decisões em Aberto:** Ajustar o feedback sonoro de encaixe mecânico (clique audível) no próximo módulo, testando a resposta tátil e auditiva em headset VR.
- **Declaração de Autoria e IA:** Assistentes de inteligência artificial foram consultados na revisão de sintaxe, conferência de matrizes matemáticas de reparenting e auditoria dos requisitos da rubrica. Todas as decisões de arquitetura de software, hierarquia de classes, modelos matemáticos e implementação de código foram validadas e testadas pela equipe.
