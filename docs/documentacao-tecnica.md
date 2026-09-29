# Documentacao tecnica completa

## 1. Objetivo

Este documento descreve o funcionamento real do projeto RV-RA: uma cena 3D de
componentes eletrônicos executada no navegador com Three.js, TypeScript, Vite e
WebXR. O sistema possui tres modos de uso:

- Desktop: camera orbital e interacao com mouse.
- VR: controles XR, raio laser e pegar/soltar componentes.
- AR: deteccao de superficies por hit-test e posicionamento de objetos.

O documento cobre todos os arquivos de codigo do projeto, suas funcoes e o
significado das linhas de codigo. Linhas vazias e comentarios nao executam
operacoes; elas apenas separam ou explicam blocos e sao indicadas como tal.

## 2. Estrutura e entrada da aplicacao

| Arquivo | Responsabilidade |
| --- | --- |
| [index.html](../index.html) | Cria o DOM e carrega os modulos. |
| [src/main.ts](../src/main.ts) | Entrada ativa, renderizacao e integracao dos modulos. |
| [src/scene.ts](../src/scene.ts) | Cena, camera, luzes, mesa, protoboard e componentes. |
| [src/controllers.ts](../src/controllers.ts) | Controles VR, raio laser e manipulacao. |
| [src/ar.ts](../src/ar.ts) | Hit-test de AR e reticulo de superficie. |
| [src/capabilities.ts](../src/capabilities.ts) | Diagnostico e painel WebXR. |
| [src/performance.ts](../src/performance.ts) | Indicador de custo do quadro dentro da cena. |
| [src/reparent.ts](../src/reparent.ts) | Troca de pai medida e conferencia em numeros. |
| [src/theme.ts](../src/theme.ts) | Tema claro/escuro e recolhimento do painel. |
| [src/vite-env.d.ts](../src/vite-env.d.ts) | Tipos globais do Vite. |
| [main.ts](../main.ts) | Entrada alternativa antiga, nao carregada pelo HTML atual. |
| [style.css](../style.css) | Layout, cores, painel, botoes e responsividade. |
| [vite.config.ts](../vite.config.ts) | Servidor Vite, HTTPS e porta. |
| [tsconfig.json](../tsconfig.json) | Regras de compilacao TypeScript. |
| [package.json](../package.json) | Dependencias e scripts npm. |

O fluxo real e:

```text
index.html -> src/theme.ts
           -> src/main.ts
              -> XRScene
              -> setupControllers
              -> setupARHitTest
              -> capabilityProbe
              -> createFrameCostIndicator (painel preso a camera)
              -> conferirTrocaDePai (tabela no console)
              -> loop setAnimationLoop
```

## 3. [src/main.ts](../src/main.ts)

Este e o ponto de entrada usado pelo `index.html`.

### Linhas 1-8: importacoes

- Linha 1 importa o namespace `THREE`, usado para renderer, relogio, raycaster,
  camera e objetos matematicos.
- Linha 2 importa `OrbitControls`, que permite girar a camera no desktop.
- Linha 3 importa `XRScene`, a classe que monta a cena.
- Linha 4 importa `setupControllers`, que monta os controles VR.
- Linha 5 importa `setupARHitTest`, que monta o sistema AR.
- Linha 6 importa `capabilityProbe`, singleton que consulta o WebXR.
- Linha 7 importa `createFrameCostIndicator`, o indicador de custo do quadro.
- Linha 8 importa `conferirTrocaDePai`, a conferencia da troca de pai, e
  `assentar`, usado ao soltar uma peca.

### Linhas 10-18: renderer e DOM

- Linha 11 busca o elemento `#app`, onde o canvas WebGL sera inserido.
- Linha 12 busca `#capability-report`, painel do relatorio.
- Linha 14 cria o renderer WebGL com antialiasing e transparencia.
- Linha 15 adapta a densidade de pixels ao dispositivo.
- Linha 16 ocupa toda a janela.
- Linha 17 habilita o subsistema XR do Three.js.
- Linha 18 adiciona o canvas ao elemento `#app`.

### Linhas 20-37: cena e controles

- Linha 21 cria uma instancia de `XRScene`.
- Linhas 24-28 criam controles orbitais, definem o ponto observado (centro da
  protoboard) e ativam amortecimento.
- Linhas 31-37 chamam `setupControllers`, compartilhando renderer, cena,
  objetos interativos, protoboard e bancada.

### Linhas 39-45: AR, sonda e mouse

- Linha 40 chama `setupARHitTest`.
- Linha 42 inicia a consulta de capacidades sem bloquear a inicializacao.
- Linha 45 liga a interacao de arrastar pecas com o mouse
  (`setupDesktopInteraction`).

### Linhas 47-52: indicador de custo e conferencia da troca de pai

- Linha 48 coloca a camera dentro do grafo de cena. Sem isso, o painel que e
  filho da camera nao seria desenhado.
- Linha 49 cria o indicador de custo, preso a camera.
- Linha 52 roda `conferirTrocaDePai()` uma vez e mostra a tabela no console.

### Linhas 54-69: loop de renderizacao

- Linha 55 cria um relogio para medir o intervalo entre frames.
- Linha 57 registra o loop WebXR com `setAnimationLoop`.
- Linha 58 marca o inicio da medicao do custo do quadro.
- Linha 59 calcula `delta`, o tempo desde o frame anterior, em segundos.
- Linha 60 atualiza a cena com o `delta`.
- Linha 61 atualiza os controles e os realces dos alvos.
- Linha 62 atualiza a orbita.
- Linha 63 verifica se existe um `XRFrame`.
- Linha 64 atualiza o hit-test AR.
- Linha 65 atualiza o relatorio de capacidades em sessao.
- Linha 67 renderiza a cena usando camera e renderer.
- Linha 68 fecha a medicao do quadro e passa o `delta` para o indicador.

### Linhas 71-76: redimensionamento

- Linha 72 registra o evento `resize`.
- Linha 73 recalcula a proporcao da camera.
- Linha 74 atualiza a matriz de projecao.
- Linha 75 redimensiona o canvas.

### Funcao [setupDesktopInteraction](../src/main.ts#L82)

Funcao nas linhas 82-162. Recebe canvas, camera, cena, lista de objetos,
protoboard e controles orbitais. Seu objetivo e arrastar componentes com mouse.

- Linhas 90-95 criam raycaster, coordenadas do mouse, plano horizontal,
  interseccao, deslocamento e ponto de soltura.
- Linha 97 guarda o objeto atualmente arrastado.

#### Funcao interna [findInteractiveParent](../src/main.ts#L99)

- Recebe qualquer objeto atingido pelo raio.
- Sobe pela cadeia `parent` enquanto o objeto nao esta em `interactive`.
- Retorna o grupo interativo ou `null`.

#### Eventos internos

- Linhas 107-131: `pointerdown` ignora XR, converte a tela para coordenadas
  normalizadas, dispara o raio, encontra o alvo, retira-o da protoboard se
  necessario, desabilita a orbita e calcula o deslocamento.
- Linhas 133-144: `pointermove` atualiza o raio e move o objeto no plano da
  mesa enquanto existe um objeto sendo arrastado.
- Linhas 146-158: `stopDrag` trata soltura e cancelamento. Componentes (qualquer
  peca que nao seja a propria placa) soltos sobre a protoboard sao anexados a ela; depois `assentar` deixa a peca
  reta e apoiada, e a orbita volta a ser habilitada.
- Linhas 160-161 registram `pointerup` e `pointercancel`.

## 4. [src/scene.ts](../src/scene.ts)

### Classe [XRScene](../src/scene.ts#L8)

Mantem `scene`, `camera`, `interactive`, `workbench` e `protoboard` como
propriedades publicas de leitura. A lista `interactive` e compartilhada com o
mouse e os controles VR.

### [constructor](../src/scene.ts#L15)

- Linhas 16-17 criam a cena e definem sua cor de fundo.
- Linhas 19-24 criam uma camera perspectiva com campo de visao 60 graus,
  proporcao da janela e limites de distancia.
- Linha 26 coloca a camera a 1,45 m de altura.
- Linhas 27-31 chamam, nesta ordem, luzes, piso, bancada, protoboard e
  componentes.

### [addLights](../src/scene.ts#L34)

- Linhas 35-38 criam e posicionam luz hemisferica.
- Linhas 40-43 criam luz direcional e habilitam sombras.
- Linhas 45-48 criam luz pontual suave sobre a bancada.

### [addFloor](../src/scene.ts#L50)

- Linha 51 cria `GridHelper` de 10 metros com 20 divisoes.
- Linha 52 fixa o piso em y=0.
- Linha 53 adiciona o piso a cena.

### [addWorkbench](../src/scene.ts#L57)

- Linha 58 usa o grupo `workbench` como raiz da mesa.
- Linhas 60-68 criam o tampo, seu material e sua posicao.
- Linhas 71-82 criam quatro pernas cilindricas a partir de offsets.
- Linhas 85-91 criam a bandeja esquerda para fios.
- Linhas 93-96 criam a bandeja direita para LEDs e resistores.
- Linha 98 adiciona o grupo completo a cena.

### [addProtoboard](../src/scene.ts#L105)

- Linhas 106-108 nomeiam, posicionam e selecionam o grupo da protoboard.
- Linhas 110-117 criam o corpo plastico.
- Linhas 119-125 criam a canaleta central.
- Linhas 127-141 criam trilhas vermelhas e azuis de alimentacao.
- Linhas 145-156 criam 84 furos visuais em uma grade simplificada, cada um
  como malha filha da protoboard.
- Linhas 158-159 adicionam a placa a cena e a lista de interativos.

### [addCircuitComponents](../src/scene.ts#L166)

- Linhas 167-178 criam tres LEDs, posicionam-nos e registram-nos.
- Linhas 180-191 criam tres fios de cores e comprimentos diferentes.
- Linhas 193-196 criam o resistor e registram-no.

### [addInteractiveComponent](../src/scene.ts#L200)

Adiciona um `Object3D` a cena e a lista `interactive`, tornando-o selecionavel.

### [createLED](../src/scene.ts#L206)

Cria um grupo com nome informado. Linhas 210-233 formam a cupula, cilindro e
aba; linhas 235-249 criam dois pinos metalicos; linha 251 cria a area de
selecao de 3 cm; linha 252 retorna o grupo.

### [createJumperWire](../src/scene.ts#L256)

Cria um grupo chamado `Fio Jumper`. Linhas 260-276 formam uma curva Bezier e
um tubo; linhas 278-287 criam as ponteiras metalicas; linha 288 cria a area
de selecao do tamanho do arco; linha 289 retorna o grupo.

### [createResistor](../src/scene.ts#L293)

Cria o grupo `Resistor`. Linhas 297-303 criam o corpo ceramico; linhas 305-316
criam quatro faixas de cor; linhas 318-327 criam os terminais metalicos;
linha 328 cria a area de selecao.

### [update](../src/scene.ts#L333)

Recebe o tempo do frame, mas ainda nao executa nada. E o ponto preparado para
fisica, animacao ou outras atualizacoes futuras.

### [addHitbox](../src/scene.ts#L342)

Cria uma caixa com `MeshBasicMaterial({ visible: false })` e adiciona ao grupo
da peca. A caixa nao e desenhada, mas o `Raycaster` do Three.js testa a malha
mesmo com material invisivel. Assim o raio do controle e o mouse acertam pecas
de poucos milimetros, e `getInteractiveRoot`/`findInteractiveParent` sobem ate
o grupo da peca. Como o material nao tem `emissive`, o realce do VR ignora a
caixa.

## 5. [src/controllers.ts](../src/controllers.ts)

### [setupControllers](../src/controllers.ts#L11)

- Linhas 19-20 criam raycaster e matriz temporaria.
- Linha 21 cria a fabrica de modelos de controle.
- Linhas 23-32 criam a geometria e o material do raio laser.
- Linhas 34-37 criam listas de controles, lasers, alvos e objetos selecionados.
- Linhas 39-53 repetem a configuracao para as duas maos: obtem controller e
  grip, adiciona laser e modelo a cena e registra `selectstart`/`selectend`.

### [getInteractiveRoot](../src/controllers.ts#L57)

Percorre `parent` ate encontrar um objeto da lista `interactive`, evitando que
um clique em um pino selecione somente o pino em vez do componente inteiro.

### [intersect](../src/controllers.ts#L65)

Extrai a rotacao mundial do controle, posiciona o raio na origem do controle,
aponta-o no eixo z negativo, faz interseccao recursiva e retorna a raiz atingida.

### [isComponent](../src/controllers.ts#L78)

Retorna verdadeiro para qualquer objeto que nao seja a propria protoboard.
Serve para LED, resistor e fio poderem prender na placa, sem a placa tentar
virar filha de si mesma.

### [isOverProtoboard](../src/controllers.ts#L82)

Refaz o raio do controle e retorna verdadeiro se ele atingir a protoboard.

### [onSelectStart](../src/controllers.ts#L89)

Localiza o alvo, anexa-o ao controle com `controller.attach` e registra a
selecao no `Map`.

### [onSelectEnd](../src/controllers.ts#L98)

Recupera o objeto selecionado. Componentes soltos sobre a placa sao anexados
a ela; fora dela, o objeto retorna ao espaco da cena. Em seguida `assentar`
(de `src/reparent.ts`) deixa a peca reta e apoiada na placa ou no tampo. Depois a selecao e removida.

### [update](../src/controllers.ts#L114)

Restaura emissivos anteriores, percorre cada controle, encurta o laser ate o
primeiro alvo e aplica realce emissivo a todas as malhas do grupo apontado.

## 6. [src/ar.ts](../src/ar.ts)

### [setupARHitTest](../src/ar.ts#L8)

- Linhas 13-20 criam o reticulo circular, desativam sua atualizacao automatica
  de matriz e o deixam invisivel.
- Linhas 22-23 criam o estado da fonte hit-test.
- Linhas 25-35 registram o controle AR. Ao selecionar com reticulo visivel,
  criam um cilindro verde, copiam a posicao detectada e colocam-no na cena.

### [update](../src/ar.ts#L37)

- Linhas 38-42 encerram cedo sem sessao, em sessao de VR (`environmentBlendMode`
  igual a `opaque`) ou sem reference space. Sem a checagem de VR, o emulador
  libera hit-test tambem no visor e cada clique plantava um cilindro.
- Linhas 45-66 solicitam uma fonte `viewer`, desde que `hit-test` esteja
  habilitado, e tratam falhas escondendo o reticulo.
- Linhas 68-76 leem resultados do frame, obtêm a pose e copiam sua matriz para
  o reticulo.
- Linhas 77-79 escondem o reticulo quando nenhuma superficie e encontrada.
- O listener de `end` nas linhas 63-67 limpa a fonte e esconde o reticulo ao
  terminar a sessao.

## 7. [src/capabilities.ts](../src/capabilities.ts)

### Tipos e constantes, linhas 3-78

- `CapabilityState` enumera estados de suporte, permissao, atividade e erro.
- `SessionModeCapability` descreve um modo WebXR.
- `FeatureCapability` descreve um recurso opcional.
- `InputCapability` descreve perfil, mao, raio, grip, hand tracking e DoF.
- `XRCapabilityReport` define o formato do relatorio completo.
- `SESSION_MODES` lista inline, VR imersiva e AR imersiva.
- `OPTIONAL_FEATURES` lista recursos que podem ser concedidos pela sessao.
- `MODE_LABELS` converte nomes tecnicos em textos da interface.
- `SessionWithFeatures` adiciona `enabledFeatures` opcional a `XRSession`.

### Classe [XRCapabilityProbe](../src/capabilities.ts#L80)

- [getReport](../src/capabilities.ts#L88): devolve o relatorio somente para
  leitura.
- [initialize](../src/capabilities.ts#L92): guarda renderer e painel, renderiza
  estado inicial, verifica `navigator.xr` e consulta os tres modos.
- [requestSession](../src/capabilities.ts#L112): monta opcoes, solicita VR/AR,
  conecta a sessao ao renderer e registra erros.
- [update](../src/capabilities.ts#L157): mede pose do visor e transforma as
  fontes de entrada da sessao em `InputCapability`.
- [probeMode](../src/capabilities.ts#L192): chama `isSessionSupported`.
- [bindSession](../src/capabilities.ts#L207): identifica features concedidas,
  define `local-floor` e registra eventos de entradas e encerramento.
- [syncInputDeclarations](../src/capabilities.ts#L246): atualiza entradas antes
  de haver uma pose disponivel.
- [emptyReport](../src/capabilities.ts#L259): cria o relatorio inicial com
  ambiente, modos, sessao inativa e nenhuma entrada.
- [touch](../src/capabilities.ts#L274): atualiza o horario e renderiza agora
  ou agenda renderizacao.
- [scheduleRender](../src/capabilities.ts#L282): evita varios renders seguidos
  e atualiza o painel depois de 250 ms.
- [render](../src/capabilities.ts#L291): reconstrói o HTML do painel com
  cabecalho, ambiente, modos, botoes, sessao, entradas e timestamp.

### Funcoes auxiliares

- [classifySessionFailure](../src/capabilities.ts#L363): transforma excecoes
  DOM em estados `nao suportado`, `negado` ou `erro`.
- [element](../src/capabilities.ts#L376): cria elemento HTML com classe e texto.
- [row](../src/capabilities.ts#L383): cria uma linha com rotulo, detalhe e badge.
- [sessionButton](../src/capabilities.ts#L393): cria botao de sessao e desabilita
  quando o modo nao e suportado ou ja esta ativo.
- [slug](../src/capabilities.ts#L408): normaliza texto para nome de classe CSS.
- [yesNo](../src/capabilities.ts#L412): converte booleano em `sim` ou `nao`.
- `capabilityProbe` na linha 416 exporta uma instancia unica da classe.

## 8. [src/performance.ts](../src/performance.ts)

Indicador de custo do quadro, desenhado dentro da cena.

- `FRAME_BUDGET_MS` (16,7) e o teto declarado na especificacao: 60 quadros por
  segundo.
- `INTERVALO_S` (0,5) define de quanto em quanto tempo o painel e redesenhado.
- [createFrameCostIndicator](../src/performance.ts#L25) cria um canvas de
  512x128, transforma-o em `CanvasTexture` e aplica num plano de 16 cm x 4 cm.
  O plano fica 50 cm a frente e 22 cm acima do centro da camera, sem teste de
  profundidade e com `renderOrder` alto, para ficar sempre por cima. Ele e
  adicionado como filho da camera, por isso acompanha a visao na tela e no
  visor.
- `desenhar` escreve custo medio contra o teto (verde abaixo, vermelho acima),
  qps e pior quadro.
- `begin()` guarda `performance.now()` no inicio do quadro.
- `end(delta)` calcula o custo do quadro, acumula soma, pior valor, numero de
  quadros e tempo. Quando o tempo acumulado passa de 0,5 s, calcula as medias,
  redesenha o painel e zera os acumuladores. O agrupamento e por tempo, nao por
  numero de quadros.
- `stats()` devolve a ultima medida.

O indicador mede o tempo de CPU do quadro (atualizacao e `renderer.render`).
Nao mede o tempo da GPU.

## 9. [src/reparent.ts](../src/reparent.ts)

Conferencia da troca de pai em numeros.

- [reparentConferido](../src/reparent.ts#L25) guarda a posicao no mundo do
  objeto, chama `novoPai.attach(obj)`, mede a posicao de novo e devolve a
  distancia entre as duas (o erro, em metros).
- [conferirTrocaDePai](../src/reparent.ts#L32) monta uma cena separada com a
  protoboard na mesma posicao de `src/scene.ts` e um fio solto sobre ela, e
  registra quatro casos:
  1. fio filho da cena;
  2. fio depois de virar filho da placa;
  3. placa movida 10 cm e girada 90 graus em Y, com o fio indo junto sem
     nenhuma conta manual;
  4. fronteira: novo pai girado e com escala 2.
- O resultado aparece no console do navegador ao abrir o ambiente e esta
  registrado em [docs/medidas.md](medidas.md).
- [assentar](../src/reparent.ts#L108) e chamada logo depois da troca de pai,
  quando a pessoa solta uma peca (mouse e VR). Primeiro `nivelar` tira a
  inclinacao e mantem so o giro em Y. Se a peca ficou presa na placa, a posicao
  local e limitada a area da placa e o Y local vira 0,009 m. Se ficou solta no
  mundo, a posicao e limitada ao tampo da mesa e o Y volta para a altura de
  repouso (1,008 m para a placa, 1,018 m para as outras pecas). A troca de pai
  preserva a posicao; o assentamento move a peca de proposito, depois dela.

## 10. [src/theme.ts](../src/theme.ts)

- Linhas 1-5 executam imediatamente e aplicam o tema salvo em `localStorage`.
- Linhas 7-11 esperam o DOM e buscam painel e botoes.
- Linhas 13-21 definem `updateThemeButton`, que sincroniza icone, aria-label e
  estado pressionado.
- Linhas 23-36 alternam o atributo `data-theme` e salvam `light` ou `dark`.
- Linhas 39-48 definem `updateCapabilityButton`, sincronizando seta e ARIA.
- Linhas 50-53 restauram o estado recolhido salvo.
- Linhas 55-56 alternam painel e salvam a preferencia.

## 11. [main.ts](../main.ts): arquivo alternativo

Este arquivo repete a inicializacao basica, mas nao e referenciado pelo
`index.html`. Ele cria renderer (linhas 8-16), `XRScene` (linha 19), orbita
(linhas 22-26), controles (linhas 29-36), AR (linha 39), sonda (linha 43),
loop (linhas 46-57) e resize (linhas 60-64). Nao possui a interacao desktop
nem a atualizacao da orbita presente em `src/main.ts`.

## 12. Arquivos nao funcionais ou de suporte

### [index.html](../index.html)

- Linhas 1-4 declaram HTML5, idioma e cabecalho.
- Linhas 5-9 definem codificacao, viewport, titulo e carregam `src/theme.ts`.
- Linha 11 carrega `style.css`.
- Linha 15 cria `#app`, destino do canvas.
- Linhas 16-20 criam uma faixa de dicas de uso no desktop: arrastar peca,
  girar a camera e aproximar com a roda do mouse.
- Linhas 22-34 criam o painel de capacidades e seus controles.
- Linha 36 carrega `src/main.ts`, iniciando a aplicacao.

### [vite.config.ts](../vite.config.ts)

- Linha 1 importa `defineConfig`.
- Linha 2 importa o plugin de SSL.
- Linha 5 exporta a configuracao Vite.
- Linha 6 habilita HTTPS autoassinado.
- Linhas 8-12 habilitam host publico e porta 5173.
- Linhas 15-16 definem alvo ES2020 e sourcemaps.

### [tsconfig.json](../tsconfig.json)

Define ES2020, modulos ESNext, DOM, resolucao Bundler, modo estrito, sem
emissao de JavaScript, verificacao de simbolos nao usados e inclui `src` e
`vite.config.ts`.

### [src/vite-env.d.ts](../src/vite-env.d.ts)

A unica linha importa os tipos oficiais do cliente Vite, incluindo tipos de
`import.meta.env` e suporte de desenvolvimento.

### [package.json](../package.json)

- Scripts: `dev` inicia Vite; `build` executa TypeScript e Vite; `preview`
  serve o build; `typecheck` executa somente TypeScript.
- Dependencia de runtime: Three.js.
- Dependencias de desenvolvimento: tipos Three.js, SSL, TypeScript e Vite.

### [style.css](../style.css)

- Linhas 1-5 zeram margens, preenchimentos e adotam `border-box`.
- Linhas 7-22 definem variaveis de cores e tipografia do tema claro.
- Linhas 24-32 substituem variaveis no tema escuro.
- Linhas 34-49 configuram pagina, fundo listrado, canvas e transicoes.
- Linhas 51-91 posicionam e recolhem o painel lateral.
- Linhas 93-115 estilizam rolagem e barra de tema.
- Linhas 117-174 definem botoes de tema e recolhimento.
- Linhas 176-246 estilizam cabecalho, titulos, cards e linhas do relatorio.
- Linhas 248-305 definem badges, mensagens, botoes de sessao e estados.
- Linhas 307-330 estilizam fontes de entrada e timestamp.
- Linhas 332-352 adaptam padding, tamanho e posicao para telas pequenas.
- Linhas 353-422 sao espacos finais ou regras complementares de responsividade
  conforme a versao atual do arquivo.

## 13. O que acontece em um frame

1. `frameCost.begin()` marca o inicio da medicao e `setAnimationLoop` calcula
   o tempo decorrido.
2. `XRScene.update` fica preparado para animacoes.
3. `controllers.update` recalcula raios e realces.
4. `arHitTest.update` atualiza o reticulo quando ha AR.
5. `capabilityProbe.update` mede pose e controles quando ha XRFrame.
6. `renderer.render` percorre o grafo de cena e envia a imagem para a GPU.
7. `frameCost.end(delta)` fecha a medicao e, a cada 0,5 s, atualiza o painel.

## 14. O que esta implementado e o que ainda e futuro

Implementado no codigo atual:

- Cena 3D, mesa, protoboard, LEDs, fios e resistor.
- Movimento com mouse no desktop.
- Raio laser e pegar/soltar com controles VR.
- Realce emissivo ao apontar.
- Hit-test AR e colocacao de cilindro de exemplo.
- Relatorio de capacidades WebXR.
- Tema claro/escuro e painel recolhivel.
- Indicador de custo do quadro dentro da cena.
- Conferencia da troca de pai em numeros (console e `docs/medidas.md`).

Descrito na especificacao, mas ainda nao implementado nos arquivos atuais:

- BFS/DFS para validar circuito entre VCC e GND.
- Snap preciso dos pinos nos furos.
- Rotacao em incrementos de 90 graus.
- Som de sucesso ou erro.
- LED acendendo por validacao eletrica.
- Instanciamento GPU dos furos.
- LOD automatico e degradacao abaixo de 45 FPS.
- Ancoragem AR persistente da protoboard.
- Ajuste de altura com `Scroll`/`Shift` e rotacao com a tecla `R`.

Essa diferenca e importante: [docs/especificacao.md](especificacao.md) descreve
o comportamento desejado do projeto, enquanto este documento descreve o que o
codigo realmente executa hoje.

## 15. Comandos de verificacao

Execute a partir da pasta do projeto:

```powershell
npm install
npm run typecheck
npm run build
npm run dev
```

No PowerShell do Windows, se os scripts estiverem bloqueados, use `npm.cmd` no
lugar de `npm`.

O servidor usa HTTPS e normalmente fica em `https://localhost:5173/`. Se a
porta estiver ocupada, o Vite escolhe outra, como `5174`.