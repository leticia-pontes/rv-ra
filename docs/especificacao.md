# Especificação do Projeto Integrador — Módulo 03

## Bloco A - A cena

### Seção 1. Identificação do grupo e da cena

- **Grupo:** Grupo 5
- **Integrantes:** Caio Ocon, Leticia Alves, Leandro, Laura Yumi, Breno Colonello
- **Cena Escolhida:** Circuito em placa de prototipagem (Protoboard).
- **Descrição:** Uma bancada de laboratório contendo uma protoboard física onde o operador apanha, translada e insere componentes eletrônicos (fios jumpers, resistores e LEDs) para fechar um circuito funcional.
- **Justificativa e Custo:** Esta cena impõe custo elevado de processamento e geometria devido à densidade de orifícios e componentes metálicos repetidos. O grupo assumiu este custo para dominar as técnicas de otimização em grafo de cena, agrupamento hierárquico e renderização em tempo real com controle orçamentário.
- **Armadilha e Solução:** A armadilha é a sobrecarga de Draw Calls gerada por centenas de furos e componentes independentes. No Módulo 03 a placa mostra uma amostra de 84 furos (uma placa real deste tamanho tem cerca de 830), cada um como malha separada dentro do grupo da protoboard, e cada componente é um `THREE.Group` com suas peças como filhas. O instanciamento dos furos (`InstancedMesh`) ficou para quando a placa tiver todos os furos (ver registro de decisões abaixo).
- **Registro de decisões que mudaram desde o Módulo 01:**
  1. **Modelos importados → formas criadas por código.** No Módulo 01 a placa, os LEDs e o resistor viriam de arquivos .gltf. Agora tudo é feito com primitivas do Three.js, em escala 1:1. **Motivo:** o Módulo 03 cobra a estrutura da cena (árvore, troca de pai, relógio) em geometria crua; carregar arquivo externo só acrescentaria tempo de carregamento e mais um ponto de falha sem ajudar a provar nada disso.
  2. **Inventário menor: 3 fios e 1 resistor (antes 15 fios e 5 resistores).** Os 3 LEDs continuam. **Motivo:** para mostrar parentesco e troca de pai basta um exemplo de cada peça. As quantidades do Módulo 01 voltam quando existir encaixe nos furos e a validação do circuito, que é quando elas passam a ser usadas.
  3. **Furos sem instanciamento, por enquanto.** O plano era usar `InstancedMesh` já neste módulo. Hoje são 84 malhas separadas. **Motivo:** com 84 furos o quadro custa 0,51 ms de um teto de 16,7 ms (`docs/medidas.md`), então o instanciamento ainda não faz diferença mensurável. Ele volta quando a placa tiver todos os furos.
  4. **Controles no lugar do rastreamento de mãos.** No visor, pegar e soltar é feito com o raio e o gatilho do controle. **Motivo:** o único teste em visor até agora foi no emulador do Meta Quest 3, que simula controles. O rastreamento de mãos fica para quando o grupo tiver um visor real para testar.
  5. **Qualquer componente prende na placa.** Na primeira versão do Módulo 03 só o fio jumper virava filho da protoboard ao ser solto sobre ela. Agora LED, resistor e fio fazem isso. **Motivo:** nos testes, LED e resistor soltos sobre a placa ficavam para trás quando a placa era movida, o que não acontece na bancada real. O encaixe exato nos furos continua planejado.
  6. **LED com 1 cm de diâmetro (antes 0,5 cm).** **Motivo:** com 0,5 cm a peça ficava pequena demais para acertar com o mouse e com o raio do controle na distância da câmera.
  7. **Um indicador de custo só, preso à câmera.** A versão anterior desta especificação descrevia um monitor 3D na bancada e um HUD em HTML. O que foi implementado é um painel único (`src/performance.ts`), filho da câmera. **Motivo:** um HUD em HTML não aparece dentro do visor, e um monitor fixo na bancada sai de vista quando a pessoa gira a câmera. Preso à câmera, o painel fica visível na tela e no visor.
  8. **Área de seleção invisível em volta das peças.** Cada componente ganhou uma caixa invisível um pouco maior que ele (3 cm no LED). **Motivo:** nos testes com o emulador, acertar o raio do controle num LED de 1 cm era muito difícil. O raio acerta a caixa e seleciona a peça inteira. A caixa não é desenhada.

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
| **LEDs Difusos** | 3 | Código (`THREE.Group` composto) | Sim | `Scene` ou `Protoboard` | Vermelho, Verde e Amarelo (cúpula com 1 cm de diâmetro, aba e pinos condutores de 1,4 cm e 1,1 cm). |
| **Resistor** | 1 | Código (`THREE.Group` composto) | Sim | `Scene` ou `Protoboard` | Corpo cerâmico de 1,5 cm x 0,3 cm com código de 4 faixas de cor (1kΩ) e terminais metálicos. |
| **Indicador de custo do quadro** | 1 | Código (`PlaneGeometry` + `CanvasTexture`, `src/performance.ts`) | Acompanha a câmera | Filho da câmera | Painel de 16 cm x 4 cm, 50 cm à frente do olho, com custo médio do quadro, qps e pior quadro. |

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
| **Apontar** | Mira o raio do controle sobre a peça (VR). No desktop, passa o mouse. | No VR, as malhas da peça ganham emissivo azulado (`0x334466`). No desktop não há realce. | Nada acontece. |
| **Apanhar** | Clica e segura sobre a peça (desktop) ou aperta o gatilho (VR). | Desktop: se a peça estava presa na placa, volta a ser filha da cena (`scene.attach`) e a órbita da câmera é desligada. VR: a peça vira filha do controle (`controller.attach`). | Clique fora de uma peça: a câmera continua orbitando. |
| **Transladar** | Arrasta o mouse (desktop) ou move o controle (VR). | Desktop: a peça anda num plano horizontal na altura da mesa (y = 1,025 m). VR: a peça acompanha o controle, por ser filha dele. | — |
| **Soltar** | Solta o botão do mouse ou o gatilho. | Peça (LED, resistor ou fio) solta sobre a protoboard vira filha dela (`protoboard.attach`) e passa a andar junto com a placa. Peça solta fora da placa vira filha da cena. Nos dois casos a peça é assentada: fica reta e apoiada na placa ou no tampo, dentro dos limites. | — |
| **Ajustar altura e rotacionar** | *Planejado:* roda do mouse ou `Shift` + arrasto para altura, tecla `R` para girar 90°. | *Ainda não implementado.* | — |

### Seção 6. A tarefa e sua validação

- **Estado Inicial:** Bancada com protoboard vazia e peças organizadas nas bandejas laterais (LEDs e resistores à direita, fios à esquerda).
- **Estado Final:** Circuito elétrico contínuo fechado entre a trilha positiva (VCC) e a trilha de terra (GND), contendo pelo menos um fio jumper, um resistor e um LED inseridos nos barramentos correspondentes, resultando na ativação emissiva do LED.
- **Validação (planejada, ainda não implementada):** a cada encaixe aceito, uma busca no grafo de conexões parte do VCC e procura um caminho contínuo até o GND passando por um LED.

### Seção 7. Regras de encaixe e tolerâncias

*Implementado hoje (`assentar`, em `src/reparent.ts`):* ao soltar, a peça fica na horizontal (só o giro em Y é mantido). Presa na placa, ela fica dentro da área da placa, com Y local de 0,009 m. Solta fora da placa, volta para cima do tampo, dentro dos limites da mesa.

*Planejado para o próximo módulo:* as folgas abaixo e o encaixe exato nos furos.

Para assegurar usabilidade sem exigir microprecisão milimétrica:

- **Folga de posição horizontal:** Tolerância de captura de até 10,0 cm no eixo longitudinal (X) e 4,5 cm no eixo transversal (Z) a partir do centro da protoboard. Ao soltar a peça dentro desta zona, o sistema realiza o encaixe automático.
- **Folga de altura vertical:** O encaixe é aceito se o componente estiver entre -4,0 cm e +20,0 cm da superfície da placa no momento da soltura.
- **Snap de assentamento:** Ao encaixar, o Y local do componente é ajustado atomicamente para `0,009 m`, garantindo alinhamento visual com a furação plástica.

### Seção 8. Retorno ao usuário

Implementado hoje:

- **Objeto sob a mira (VR):** emissivo azulado (`0x334466`) em todas as malhas da peça apontada.
- **Objeto apanhado:** a peça acompanha o mouse ou o controle.
- **Peça solta sobre a placa:** vira filha da protoboard; mover a placa leva a peça junto.
- **Área de seleção:** cada peça tem uma caixa invisível maior que ela, para o raio e o mouse acertarem com facilidade.
- **Troca de pai conferida em números:** ao abrir o ambiente, o console do navegador mostra a tabela gerada por `conferirTrocaDePai()` (`src/reparent.ts`), com a posição no mundo antes e depois.

Planejado:

- Cursor de mão no desktop, elevação da peça ao ser apanhada, som de encaixe aceito e recusado.
- **Sucesso do circuito:** a cúpula do LED fica emissiva e acende um ponto de luz local.

---

## Bloco C - A máquina

### Seção 9. Os três regimes

> **Declaração do Estado Atual (Módulo 03):** O regime **Na tela (inline)** é o **único plenamente funcional neste ponto do percurso e roda sem equipamento adicional em qualquer computador convencional**. Os regimes **No visor (VR)** e **Pela câmera (AR)** contam com a sonda de capacidades de hardware ativa (`src/capabilities.ts`) e infraestrutura de controladores e hit-test preparados, constituindo metas de entrega para os blocos posteriores quando o hardware for disponibilizado. Hoje as duas sessões já abrem no Chrome com o emulador Immersive Web Emulator (Meta Quest 3 emulado); a tabela de aparelhos testados está em `docs/medidas.md`.

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
- **Indicador visível na cena:** painel em `CanvasTexture` preso à câmera (`src/performance.ts`), por isso aparece igual na tela e no visor. A cada 0,5 s mostra o custo médio do quadro contra o teto, os quadros por segundo e o pior quadro do intervalo. O texto fica verde abaixo do teto e vermelho acima.
- **O que o indicador mede:** o tempo de CPU do quadro inteiro (atualização + `renderer.render`), com `performance.now()`. Não mede o tempo que a GPU leva para desenhar.
- **Custo medido:** 0,51 ms por quadro (pior 0,8 ms) a 60 qps, no regime de tela, em um PC com Intel i5-12400F, 16 GB e RTX 3060, Chrome 150. Os 60 qps são o limite do monitor, não da cena. Detalhes em `docs/medidas.md`.
- **Ordem de degradação (planejada, ainda não implementada):** caso o custo ultrapasse 20,0 ms por mais de 60 quadros consecutivos:
  1. Desativar sombras dinâmicas da luz direcional (`dirLight.castShadow = false`);
  2. Reduzir a taxa de atualização do indicador de custo;
  3. Desativar o antialiasing do WebGLRenderer.

### Seção 11. Erros, limites e degradação

- **WebXR não disponível:** Se o navegador não suportar a API WebXR, a sonda de capacidades acusa o estado `"não suportado"`, desativa os botões "Testar VR" e "Testar AR" e mantém o regime de tela perfeitamente ativo e navegável.
- **Permissão de Câmera/VR negada:** O erro `NotAllowedError` é capturado e classificado separadamente como `"negado"` pela sonda, sem travar a aplicação nem causar erro silencioso.
- **Peça solta fora da placa ou fora da mesa:** a peça volta para cima do tampo, reta, e é trazida para dentro dos limites da mesa (1,20 m x 0,70 m, com 2 cm de margem). Não há colisão entre peças: a placa pode ser solta por cima de uma peça que está no tampo (planejado).

---

## Bloco D - O trabalho

### Seção 12. Ativos, formatos e licenças

> **Atualização do Módulo 03:** Todos os ativos visuais presentes no estado atual da entrega foram construídos proceduralmente em código pelo grupo utilizando primitivas do Three.js, com custo zero de carregamento externo e domínio público integral.

| Ativo | Formato / Tipo | Origem | Licença | Finalidade |
| :--- | :--- | :--- | :--- | :--- |
| **Bancada e Bandejas** | Geometrias procedurais (`BoxGeometry`, `CylinderGeometry`) | Código próprio (`src/scene.ts`) | Autoria própria | Suporte físico da cena. |
| **Protoboard Estrutural** | Malhas agrupadas em `THREE.Group` | Código próprio (`src/scene.ts`) | Autoria própria | Base e barramento de alimentação. |
| **Fios Jumpers, LEDs e Resistores** | Tubos de Bézier, cilindros e esferas | Código próprio (`src/scene.ts`) | Autoria própria | Componentes de circuito móveis. |
| **Indicador de custo do quadro** | `PlaneGeometry` + `CanvasTexture` | Código próprio (`src/performance.ts`) | Autoria própria | Indicador de custo dentro da cena, preso à câmera. |
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
