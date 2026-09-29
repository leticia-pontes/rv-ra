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
              -> loop setAnimationLoop
```

## 3. [src/main.ts](../src/main.ts)

Este e o ponto de entrada usado pelo `index.html`.

### Linhas 1-6: importacoes

- Linha 1 importa o namespace `THREE`, usado para renderer, relogio, raycaster,
  camera e objetos matematicos.
- Linha 2 importa `OrbitControls`, que permite girar a camera no desktop.
- Linha 3 importa `XRScene`, a classe que monta a cena.
- Linha 4 importa `setupControllers`, que monta os controles VR.
- Linha 5 importa `setupARHitTest`, que monta o sistema AR.
- Linha 6 importa `capabilityProbe`, singleton que consulta o WebXR.

### Linhas 8-17: renderer e DOM

- Linha 8 busca o elemento `#app`, onde o canvas WebGL sera inserido.
- Linha 9 busca `#capability-report`, painel do relatorio.
- Linha 11 cria o renderer WebGL com antialiasing e transparencia.
- Linha 12 adapta a densidade de pixels ao dispositivo.
- Linha 13 ocupa toda a janela.
- Linha 14 habilita o subsistema XR do Three.js.
- Linha 15 adiciona o canvas ao elemento `#app`.
- Linhas 7, 10 e 16 sao separadores/comentarios ou espacos sem efeito.

### Linhas 19-30: cena e controles

- Linha 19 cria uma instancia de `XRScene`.
- Linhas 22-26 criam controles orbitais, definem o ponto observado e ativam
  amortecimento.
- Linhas 29-30 chamam `setupControllers`, compartilhando renderer, cena,
  objetos interativos, protoboard e bancada.

### Linhas 33-37: AR e sonda

- Linha 33 chama `setupARHitTest`.
- Linha 36 inicia a consulta de capacidades sem bloquear a inicializacao.
- Os comentarios nas linhas 34-35 explicam que a sonda consulta imediatamente
  e mede recursos completos quando uma sessao e aberta.

### Linhas 39-57: loop de renderizacao

- Linha 39 cria um relogio para medir o intervalo entre frames.
- Linha 41 registra o loop WebXR com `setAnimationLoop`.
- Linha 42 calcula `delta`, o tempo desde o frame anterior.
- Linha 43 atualiza a cena.
- Linha 44 atualiza os controles e os realces dos alvos.
- Linha 45 verifica se existe um `XRFrame`.
- Linha 46 atualiza o hit-test AR.
- Linha 47 atualiza o relatorio de capacidades em sessao.
- Linha 49 renderiza a cena usando camera e renderer.
- Linhas 40, 48 e 50-51 sao separadores ou fechamento do callback.

### Linhas 54-59: redimensionamento

- Linha 54 registra o evento `resize`.
- Linha 55 recalcula a proporcao da camera.
- Linha 56 atualiza a matriz de projecao.
- Linha 57 redimensiona o canvas.
- Linhas 53 e 58-59 fecham o callback e separam o proximo bloco.

### Funcao [setupDesktopInteraction](../src/main.ts#L62)

Funcao nas linhas 62-150. Recebe canvas, camera, cena, lista de objetos,
protoboard e controles orbitais. Seu objetivo e arrastar componentes com mouse.

- Linhas 69-74 criam raycaster, coordenadas do mouse, plano horizontal,
  interseccao, deslocamento e ponto de soltura.
- Linha 76 guarda o objeto atualmente arrastado.

#### Funcao interna [findInteractiveParent](../src/main.ts#L78)

- Recebe qualquer objeto atingido pelo raio.
- Sobe pela cadeia `parent` enquanto o objeto nao esta em `interactive`.
- Retorna o grupo interativo ou `null`.

#### Eventos internos

- Linhas 87-110: `pointerdown` ignora XR, converte a tela para coordenadas
  normalizadas, dispara o raio, encontra o alvo, retira-o da protoboard se
  necessario, desabilita a orbita e calcula o deslocamento.
- Linhas 112-123: `pointermove` atualiza o raio e move o objeto no plano da
  mesa enquanto existe um objeto sendo arrastado.
- Linhas 125-139: `stopDrag` trata soltura e cancelamento. Jumpers que foram
  soltos sobre a protoboard sao anexados a ela; depois a orbita volta a ser
  habilitada.
- Linhas 141-142 registram `pointerup` e `pointercancel`.

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
- Linhas 28-32 chamam, nesta ordem, luzes, piso, bancada, protoboard e
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
- Linhas 143-153 criam furos visuais em uma grade simplificada.
- Linhas 155-157 adicionam a placa a cena e a lista de interativos.

### [addCircuitComponents](../src/scene.ts#L166)

- Linhas 168-181 criam tres LEDs, posicionam-nos e registram-nos.
- Linhas 184-195 criam tres fios de cores e comprimentos diferentes.
- Linhas 198-201 criam o resistor e registram-no.

### [addInteractiveComponent](../src/scene.ts#L204)

Adiciona um `Object3D` a cena e a lista `interactive`, tornando-o selecionavel.

### [createLED](../src/scene.ts#L210)

Cria um grupo com nome informado. Linhas 216-232 formam a cupula, cilindro e
aba; linhas 235-251 criam dois pinos metalicos; linha 253 retorna o grupo.

### [createJumperWire](../src/scene.ts#L259)

Cria um grupo chamado `Fio Jumper`. Linhas 263-273 formam uma curva Bezier e
um tubo; linhas 276-289 criam as ponteiras metalicas e retornam o grupo.

### [createResistor](../src/scene.ts#L295)

Cria o grupo `Resistor`. Linhas 300-307 criam o corpo ceramico; linhas 309-318
criam quatro faixas de cor; linhas 321-329 criam os terminais metalicos.

### [update](../src/scene.ts#L333)

Recebe o tempo do frame, mas ainda nao executa nada. E o ponto preparado para
fisica, animacao ou outras atualizacoes futuras.

## 5. [src/controllers.ts](../src/controllers.ts)

### [setupControllers](../src/controllers.ts#L10)

- Linhas 18-19 criam raycaster e matriz temporaria.
- Linha 20 cria a fabrica de modelos de controle.
- Linhas 22-31 criam a geometria e o material do raio laser.
- Linhas 33-36 criam listas de controles, lasers, alvos e objetos selecionados.
- Linhas 38-52 repetem a configuracao para as duas maos: obtem controller e
  grip, adiciona laser e modelo a cena e registra `selectstart`/`selectend`.

### [getInteractiveRoot](../src/controllers.ts#L56)

Percorre `parent` ate encontrar um objeto da lista `interactive`, evitando que
um clique em um pino selecione somente o pino em vez do componente inteiro.

### [intersect](../src/controllers.ts#L64)

Extrai a rotacao mundial do controle, posiciona o raio na origem do controle,
aponta-o no eixo z negativo, faz interseccao recursiva e retorna a raiz atingida.

### [isJumperWire](../src/controllers.ts#L77)

Retorna verdadeiro quando o nome do objeto e `Fio Jumper`.

### [isOverProtoboard](../src/controllers.ts#L81)

Refaz o raio do controle e retorna verdadeiro se ele atingir a protoboard.

### [onSelectStart](../src/controllers.ts#L88)

Localiza o alvo, anexa-o ao controle com `controller.attach` e registra a
selecao no `Map`.

### [onSelectEnd](../src/controllers.ts#L97)

Recupera o objeto selecionado. Jumpers sobre a placa sao anexados a ela;
qualquer outro objeto retorna ao espaco da cena. Depois a selecao e removida.

### [update](../src/controllers.ts#L112)

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

- Linhas 38-43 encerram cedo sem sessao ou reference space.
- Linhas 45-66 solicitam uma fonte `viewer`, desde que `hit-test` esteja
  habilitado, e tratam falhas escondendo o reticulo.
- Linhas 68-76 leem resultados do frame, obtêm a pose e copiam sua matriz para
  o reticulo.
- Linhas 77-79 escondem o reticulo quando nenhuma superficie e encontrada.
- O listener de `end` nas linhas 58-62 limpa a fonte ao terminar a sessao.

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

## 8. [src/theme.ts](../src/theme.ts)

- Linhas 1-5 executam imediatamente e aplicam o tema salvo em `localStorage`.
- Linhas 7-11 esperam o DOM e buscam painel e botoes.
- Linhas 13-21 definem `updateThemeButton`, que sincroniza icone, aria-label e
  estado pressionado.
- Linhas 23-36 alternam o atributo `data-theme` e salvam `light` ou `dark`.
- Linhas 39-48 definem `updateCapabilityButton`, sincronizando seta e ARIA.
- Linhas 50-53 restauram o estado recolhido salvo.
- Linhas 55-56 alternam painel e salvam a preferencia.

## 9. [main.ts](../main.ts): arquivo alternativo

Este arquivo repete a inicializacao basica, mas nao e referenciado pelo
`index.html`. Ele cria renderer (linhas 8-16), `XRScene` (linha 19), orbita
(linhas 22-26), controles (linhas 29-36), AR (linha 39), sonda (linha 43),
loop (linhas 46-57) e resize (linhas 60-64). Nao possui a interacao desktop
nem a atualizacao da orbita presente em `src/main.ts`.

## 10. Arquivos nao funcionais ou de suporte

### [index.html](../index.html)

- Linhas 1-4 declaram HTML5, idioma e cabecalho.
- Linhas 5-9 definem codificacao, viewport, titulo e carregam `src/theme.ts`.
- Linha 11 carrega `style.css`.
- Linha 15 cria `#app`, destino do canvas.
- Linhas 17-25 criam o painel de capacidades e seus controles.
- Linha 27 carrega `src/main.ts`, iniciando a aplicacao.

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

## 11. O que acontece em um frame

1. `setAnimationLoop` calcula o tempo decorrido.
2. `XRScene.update` fica preparado para animacoes.
3. `controllers.update` recalcula raios e realces.
4. `arHitTest.update` atualiza o reticulo quando ha AR.
5. `capabilityProbe.update` mede pose e controles quando ha XRFrame.
6. `renderer.render` percorre o grafo de cena e envia a imagem para a GPU.

## 12. O que esta implementado e o que ainda e futuro

Implementado no codigo atual:

- Cena 3D, mesa, protoboard, LEDs, fios e resistor.
- Movimento com mouse no desktop.
- Raio laser e pegar/soltar com controles VR.
- Realce emissivo ao apontar.
- Hit-test AR e colocacao de cilindro de exemplo.
- Relatorio de capacidades WebXR.
- Tema claro/escuro e painel recolhivel.

Descrito na especificacao, mas ainda nao implementado nos arquivos atuais:

- BFS/DFS para validar circuito entre VCC e GND.
- Snap preciso dos pinos nos furos.
- Rotacao em incrementos de 90 graus.
- Som de sucesso ou erro.
- LED acendendo por validacao eletrica.
- Instanciamento GPU dos furos.
- LOD automatico e degradacao abaixo de 45 FPS.
- Ancoragem AR persistente da protoboard.

Essa diferenca e importante: [docs/especificacao.md](especificacao.md) descreve
o comportamento desejado do projeto, enquanto este documento descreve o que o
codigo realmente executa hoje.

## 13. Comandos de verificacao

Execute a partir de `rv-ra-main`:

```powershell
npm install
npm run typecheck
npm run build
npm run dev
```

O servidor usa HTTPS e normalmente fica em `https://localhost:5173/`. Se a
porta estiver ocupada, o Vite escolhe outra, como `5174`.