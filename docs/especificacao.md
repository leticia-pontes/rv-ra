# Especificação do Projeto Integrador

## Bloco A - A cena

### Seção 1. Identificação do grupo e da cena
* **Grupo:** Grupo 5
* **Integrantes:** Caio Ocon, Leticia Alves, Leandro, Laura Yumi, Breno Colonello
* **Cena Escolhida:** Circuito em placa de prototipagem.
* **Descrição:** Uma bancada contendo uma protoboard física onde o usuário insere componentes eletrônicos (fios, resistores e LEDs) para fechar um circuito elétrico funcional.
* **Justificativa e Custo:** Esta cena endurece o orçamento de quadro, memória e carregamento devido às centenas de furos da placa, e o grupo topa esse custo para aprender a dominar o teto da máquina otimizando repetições. O grupo topa esse custo porque o desafio principal é a lógica de grafos (nós e conexões) e a otimização estrutural.
* **Armadilha e Solução:** A armadilha é o excesso de objetos (centenas de furos na placa) derrubando o desempenho. A solução será desenhar a placa de forma simplificada, usando instanciamento de geometria (GPU instancing) para os furos e contatos, em vez de modelar cada orifício individualmente.

### Seção 2. O que a pessoa faz ali
A pessoa chega ao ambiente e vê uma protoboard vazia e uma bandeja com componentes (LEDs, resistores e jumpers). Ela apanha um componente por vez e o aproxima dos furos da placa. Quando a peça está alinhada, ela a solta para encaixar. O ambiente considera a tarefa cumprida quando um circuito fechado é formado ligando a trilha de energia à trilha de terra passando pelo LED, fazendo-o acender.
* **O que se faz com as mãos:** O usuário utiliza as mãos para fazer o movimento de pinça, apanhando, transladando e rotacionando componentes pequenos com precisão.
* **O que muda com o visor:** O visor oferece a percepção de profundidade estereoscópica necessária para alinhar os pinos finos dos componentes diretamente sobre os furos minúsculos, algo difícil de julgar em uma tela 2D.
* **O que a câmera precisa provar:** A cena será ancorada e alinhada a uma mesa física real do laboratório, permitindo que o usuário ande ao redor da mesa para ver o circuito montado por diferentes ângulos sem que a placa deslize no espaço real.

### Seção 3. Inventário de objetos
| Objeto | Quantos | Origem | Move? | Observação |
| :--- | :--- | :--- | :--- | :--- |
| Protoboard | 1 | Modelo importado, licença livre | Não | Base fixa do circuito. |
| Jumpers (Fios) | 15 | Construído por código | Sim | Malhas geradas proceduralmente para ligar dois pontos. |
| Resistores | 5 | Modelo importado | Sim | Todos iguais, muda apenas as faixas de cor. |
| LEDs | 3 | Modelo importado | Sim | Lâmpadas que alteram o material (acendem) no sucesso. |
| Mesa de apoio | 1 | Construída por código | Não | Superfície de colisão invisível na RA. |

### Seção 4. O espaço e as escalas
A placa de prototipagem tem 16,5 cm de comprimento por 5,5 cm de largura. Os jumpers variam de 2 cm a 10 cm. Os LEDs possuem 0,5 cm de diâmetro. O ambiente total necessário é o de uma mesa de trabalho padrão (aproximadamente 1,20 m x 0,60 m).
A cena operará em apenas uma escala legítima: escala real (1:1). Tanto na tela, quanto no visor e na câmera, os componentes terão seu tamanho físico verdadeiro, exigindo que o usuário se aproxime da mesa (real ou virtual) para manipular as peças.

## Bloco B - As regras

### Seção 5. As ações do usuário
| Ação | O que a pessoa faz | O que o sistema faz | Se não puder |
| :--- | :--- | :--- | :--- |
| Apontar | Mira um componente na bandeja. | O componente ganha um contorno amarelo. | Nada acontece (nenhum realce). |
| Apanhar | Aciona o gatilho/clique sobre a peça. | A peça flutua e acompanha o movimento da mão. | Toca som de erro surdo; exibe texto "Sem peças restantes". |
| Rotacionar | Move o pulso/scroll do mouse. | A peça gira em incrementos de 90 graus. | Não se aplica (sempre pode girar se estiver na mão). |
| Encaixar | Aproxima os pinos da placa e solta. | A peça assenta nos furos (snap) e trava na grade. | A peça volta para a bandeja; som de recusa (furo ocupado ou fora de alinhamento). |

### Seção 6. A tarefa e sua validação
* **Estado Inicial:** Placa vazia; componentes disponíveis na bandeja lateral.
* **Estado Final:** Placa com componentes formando um circuito fechado entre VCC e GND, com o LED aceso.
* **Regra e Ordem:** A ordem de montagem é totalmente livre (qualquer caminho que feche o conjunto vale).
* **Validação:** A cada encaixe, o sistema roda um algoritmo de busca em grafos (DFS/BFS) partindo do pino VCC. O sucesso é declarado automaticamente no momento em que o grafo encontra um caminho contínuo de nós conectados até o GND passando por um nó do tipo "LED".

### Seção 7. Regras de encaixe e tolerâncias
Para que o usuário não sofra uma "tortura de precisão", os pinos não precisam tocar exatamente no furo.
* **Folga de posição:** 1,5 centímetros. Se o pino central do componente estiver dentro desse raio em relação ao furo desejado, ele salta (snap) para o centro do furo.
* **Folga de ângulo:** 25 graus. Se a inclinação da mão passar disso, o sistema assume que o usuário está tentando inserir a peça torta e recusa o encaixe.

### Seção 8. Retorno ao usuário
* **Objeto mirado:** Contorno (outline) amarelo em volta da malha 3D.
* **Objeto apanhado:** Projeta uma sombra artificial (drop shadow) diretamente abaixo de si para ajudar na noção de profundidade.
* **Encaixe aceito:** Som curto mecânico (clique de plástico) e a peça perde o contorno.
* **Encaixe recusado:** Som curto grave (bipe de erro) e a peça retorna suavemente (interpolação) à sua origem na bandeja.
* **Tarefa concluída:** O material do LED muda para emissivo (brilha em vermelho) e um som de sucesso é tocado.

## Bloco C - A máquina

### Seção 9. Os três regimes
| Aspecto | Na tela | No visor | Pela câmera |
| :--- | :--- | :--- | :--- |
| **Como se olha** | Mouse para girar a câmera ao redor do centro da mesa. | Movimento natural da cabeça no espaço 3D (6DOF). | Movimento do celular ao redor da mesa física. |
| **Como se aponta e age** | Cursor do mouse (Raycast do centro da tela) + Clique. | Apontamento com o controle + Gatilho. | Toque na tela sobre o objeto projetado na imagem real. |
| **Escala da cena** | Renderizada no centro da tela. | 1:1, usuário percebe a placa com 16,5 cm na sua frente. | 1:1, sobreposta a uma mesa real do usuário. |
| **O que a cena faz de diferente** | Interface com ícones de ajuda fixos nos cantos da tela. | Rastreamento total de mãos para apanhar objetos. | Busca de planos horizontais reais para ancoragem da placa. |
| **O que não existe neste regime** | Sem percepção real de profundidade e sem ancoragem física. | Sem necessidade de detectar planos do mundo real (VR puro). | Sem oclusão perfeita das mãos do usuário passando na frente. |

### Seção 10. Orçamento e desempenho
* **Inventário Total:** Aproximadamente 25 objetos manipuláveis + 1 placa base de alta repetição geométrica.
* **Meta de Fluidez:** 60 quadros por segundo constantes, para evitar mal-estar físico no visor.
* **Repetição:** Os furos metálicos da protoboard. Serão usados shaders simples e instanciamento para não sobrecarregar a GPU integrada das máquinas do laboratório.
* **Ordem de Degradação:** Se a taxa de quadros cair abaixo de 45fps, o sistema irá, nesta ordem: 1) Desligar as sombras dinâmicas projetadas pelas peças; 2) Trocar o modelo 3D dos componentes para caixas coloridas simples (LOD baixo); 3) Desativar o antialiasing.

### Seção 11. Erros, limites e degradação
* **Regime não suportado:** Se a máquina não tiver suporte a WebXR (VR), um aviso em texto 2D flutuante dirá "Visor não detectado. Iniciando em modo de Tela" e o caso base será carregado.
* **Câmera negada:** Se o usuário recusar a permissão da câmera no celular, o sistema avisará "Câmera necessária para Realidade Aumentada" e carregará o regime de tela com um fundo cinza.
* **Rastreamento perdido:** Se a câmera apontar para uma parede lisa, a protoboard congela na última posição conhecida e fica semitransparente até o chão/mesa ser detectado novamente.
* **Fora de alcance:** Se o usuário soltar uma peça fora dos limites da grade da protoboard (espaço útil), a peça é instantaneamente teletransportada de volta para a bandeja.

## Bloco D - O trabalho

### Seção 12. Ativos, formatos e licenças
| Ativo | Origem | Licença | Endereço |
| :--- | :--- | :--- | :--- |
| Protoboard 3D (.gltf) | Sketchfab (Usuário X) | CC-BY 4.0 | [Link do Sketchfab] |
| LED 3D (.gltf) | Criado pelo grupo | Domínio Público | Repositório local |
| Som de clique (.wav) | Freesound.org | CC0 | [Link do Freesound] |

### Seção 13. Plano de construção por blocos
* **Bloco 1:** Ambiente base rodando no regime de tela, placa visível, câmera orbitando com o mouse (sem peças).
* **Bloco 2:** Ações de apontar, apanhar e transladar componentes em 3D implementadas e funcionando com mouse.
* **Bloco 3:** Lógica de encaixe (snap) implementada; sistema de grafos reconhece o circuito e acende o LED.
* **Bloco 4:** Integração do WebXR. Suporte final ao visor e à câmera (ancoragem) com testes de degradação.

### Seção 14. Riscos, decisões em aberto e declarações
* **Riscos:** A lógica de grafos para verificar o circuito pode se tornar pesada a cada clique. A mitigação será rodar a verificação apenas no momento exato em que um encaixe for aceito.
* **Decisões em aberto:** Ainda não sabemos se a folga de ângulo de 25 graus para encaixe é restrita demais no controle de VR. Testaremos no visor assim que o Bloco estiver pronto para definir o número final.
* **Declaração de IA:** Ferramentas de inteligência artificial foram utilizadas para debater e estruturar ideias e sujestões para o rascunho desta especificação e organizar as formatações em Markdown. Toda a lógica estrutural foi revisada manualmente pelo grupo para garantir que conseguimos implementar o código necessário.
