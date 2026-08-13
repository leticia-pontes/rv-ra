# VR Bombanana

Um projeto experimental de **WebXR** (Realidade Virtual e Realidade Aumentada) desenvolvido com **Three.js**, **TypeScript** e **Vite**.

O projeto serve como um boilerplate interativo e educacional para criar cenas imersivas em 3D executadas diretamente no navegador, suportando tanto headsets VR (como o Meta Quest) quanto dispositivos móveis compatíveis com AR (como smartphones Android via ARCore).

---

## Funcionalidades

*   **Virtual Reality (VR) Imersivo**:
    *   Suporte a tracking de controllers 3D.
    *   Sistema de mira/apontamento por raio laser (raycast).
    *   Mecânica de pegar (grab) e soltar (release) objetos usando os gatilhos dos controles.
    *   Efeito de realce (emissivo) ao apontar para objetos interativos.
*   **Augmented Reality (AR) com Hit-Testing**:
    *   Detecção de superfícies reais em tempo real (chão, mesas, etc.).
    *   Retículo de mira (cursor 3D) projetado sobre as superfícies detectadas.
    *   Interação por toque na tela para plantar/instanciar objetos 3D no mundo real.
*   **Modo Desktop (Fallback)**:
    *   Visualização 3D convencional no navegador quando fora de dispositivos XR.
    *   Navegação orbital intuitiva via mouse (OrbitControls).
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
vr-bombanana/
├── .nvmrc              # Versão recomendada do Node.js (v24.15.0)
├── index.html          # Página principal e container do app
├── package.json        # Dependências e scripts npm
├── tsconfig.json       # Configurações do compilador TypeScript
├── vite.config.ts      # Configurações do Vite (porta, HTTPS, host público)
├── public/
│   └── models/
│       └── cubone.glb  # Modelo 3D de exemplo
└── src/
    ├── main.ts         # Ponto de entrada, loop de renderização e inicialização WebXR
    ├── scene.ts        # Setup da cena, luzes, malhas (meshes) e animação básica
    ├── controllers.ts  # Gerenciamento de controllers VR (raio e interações)
    ├── ar.ts           # Lógica de AR e hit-testing (posicionamento na superfície)
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
4.  Clique nos botões correspondentes no rodapé da página para iniciar a experiência:
    *   **ENTER VR**: Se estiver usando um óculos de realidade virtual.
    *   **START AR**: Se estiver usando um dispositivo móvel com suporte a Realidade Aumentada.