import * as THREE from 'three';

export type CapabilityState =
  | 'verificando'
  | 'suportado'
  | 'não suportado'
  | 'concedido'
  | 'negado'
  | 'não concedido'
  | 'indeterminado'
  | 'ativo'
  | 'inativo'
  | 'erro';

export interface SessionModeCapability {
  mode: XRSessionMode;
  state: CapabilityState;
  detail?: string;
}

export interface FeatureCapability {
  name: string;
  state: CapabilityState;
  detail?: string;
}

export interface InputCapability {
  id: string;
  handedness: XRHandedness;
  targetRayMode: XRTargetRayMode;
  profiles: string[];
  hasGrip: boolean;
  hasHandTracking: boolean;
  degreesOfFreedom: '6DoF' | '3DoF' | 'sem pose' | 'aguardando pose';
}

export interface XRCapabilityReport {
  checkedAt: string;
  environment: {
    secureContext: boolean;
    webXRApi: CapabilityState;
    userAgent: string;
  };
  modes: SessionModeCapability[];
  activeSession: {
    mode: XRSessionMode | null;
    state: CapabilityState;
    features: FeatureCapability[];
  };
  tracking: {
    viewer: '6DoF' | '3DoF' | 'sem pose' | 'fora de sessão';
    referenceSpace: XRReferenceSpaceType | 'nenhum';
  };
  inputs: InputCapability[];
  lastError?: string;
}

const SESSION_MODES: XRSessionMode[] = ['inline', 'immersive-vr', 'immersive-ar'];
const OPTIONAL_FEATURES = [
  'local-floor',
  'bounded-floor',
  'unbounded',
  'hit-test',
  'anchors',
  'plane-detection',
  'depth-sensing',
  'dom-overlay',
  'hand-tracking',
  'layers',
] as const;

const MODE_LABELS: Record<XRSessionMode, string> = {
  inline: 'Inline',
  'immersive-vr': 'VR imersiva',
  'immersive-ar': 'AR imersiva',
};

type SessionWithFeatures = XRSession & { enabledFeatures?: string[] | Set<string> };

export class XRCapabilityProbe {
  private report: XRCapabilityReport = this.emptyReport();
  private panel: HTMLElement | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private activeMode: XRSessionMode | null = null;
  private referenceSpaceType: XRReferenceSpaceType | 'nenhum' = 'nenhum';

  getReport(): Readonly<XRCapabilityReport> {
    return this.report;
  }

  async initialize(renderer: THREE.WebGLRenderer, mount: HTMLElement): Promise<void> {
    this.renderer = renderer;
    this.panel = mount;
    this.render();

    if (!navigator.xr) {
      this.report.environment.webXRApi = 'não suportado';
      this.report.modes.forEach((mode) => {
        mode.state = 'não suportado';
        mode.detail = 'navigator.xr não foi declarado pelo navegador';
      });
      this.touch();
      return;
    }

    this.report.environment.webXRApi = 'suportado';
    await Promise.all(SESSION_MODES.map((mode) => this.probeMode(mode)));
    this.touch();
  }

  async requestSession(mode: 'immersive-vr' | 'immersive-ar'): Promise<void> {
    if (!navigator.xr || !this.renderer) return;

    this.report.lastError = undefined;
    this.report.activeSession = {
      mode,
      state: 'verificando',
      features: OPTIONAL_FEATURES.map((name) => ({ name, state: 'indeterminado' })),
    };
    this.touch();

    const init: XRSessionInit & Record<string, unknown> = {
      requiredFeatures: [],
      optionalFeatures: [...OPTIONAL_FEATURES],
    };

    if (mode === 'immersive-ar') {
      init.domOverlay = { root: document.body };
      init.depthSensing = {
        usagePreference: ['cpu-optimized', 'gpu-optimized'],
        dataFormatPreference: ['luminance-alpha', 'float32'],
      };
    }

    try {
      const session = await navigator.xr.requestSession(mode, init);
      this.activeMode = mode;
      this.bindSession(session);
      await this.renderer.xr.setSession(session);
    } catch (error) {
      const failure = classifySessionFailure(error);
      this.report.activeSession.state = failure.state;
      this.report.lastError = failure.detail;

      const modeReport = this.report.modes.find((item) => item.mode === mode);
      if (modeReport && failure.state === 'não suportado') {
        modeReport.state = 'não suportado';
        modeReport.detail = failure.detail;
      } else if (modeReport && failure.state === 'negado') {
        modeReport.detail = `Suportado, mas a abertura foi negada: ${failure.detail}`;
      }
      this.touch();
    }
  }

  update(frame: XRFrame): void {
    const session = frame.session;
    const referenceSpace = this.renderer?.xr.getReferenceSpace();
    if (!referenceSpace) return;

    const viewerPose = frame.getViewerPose(referenceSpace);
    this.report.tracking.viewer = viewerPose
      ? viewerPose.emulatedPosition
        ? '3DoF'
        : '6DoF'
      : 'sem pose';

    this.report.inputs = Array.from(session.inputSources).map((source, index) => {
      const trackedSpace = source.gripSpace ?? source.targetRaySpace;
      const pose = frame.getPose(trackedSpace, referenceSpace);
      const hand = (source as XRInputSource & { hand?: unknown }).hand;

      return {
        id: `${source.handedness || 'none'}-${index}`,
        handedness: source.handedness,
        targetRayMode: source.targetRayMode,
        profiles: [...source.profiles],
        hasGrip: Boolean(source.gripSpace),
        hasHandTracking: Boolean(hand),
        degreesOfFreedom: pose
          ? pose.emulatedPosition
            ? '3DoF'
            : '6DoF'
          : 'sem pose',
      };
    });

    this.touch(false);
  }

  private async probeMode(mode: XRSessionMode): Promise<void> {
    const target = this.report.modes.find((item) => item.mode === mode);
    if (!target || !navigator.xr) return;

    try {
      target.state = (await navigator.xr.isSessionSupported(mode))
        ? 'suportado'
        : 'não suportado';
    } catch (error) {
      const failure = classifySessionFailure(error);
      target.state = failure.state;
      target.detail = failure.detail;
    }
  }

  private bindSession(session: XRSession): void {
    const enabledFeatures = (session as SessionWithFeatures).enabledFeatures;
    const enabled = enabledFeatures
      ? new Set(Array.from(enabledFeatures))
      : null;

    this.report.activeSession = {
      mode: this.activeMode,
      state: 'ativo',
      features: OPTIONAL_FEATURES.map((name) => ({
        name,
        state: enabled ? (enabled.has(name) ? 'concedido' : 'não concedido') : 'indeterminado',
        detail: enabled && !enabled.has(name)
          ? 'A WebXR não informa se o recurso está ausente ou se não foi autorizado.'
          : enabled
            ? undefined
            : 'Este navegador não expõe XRSession.enabledFeatures.',
      })),
    };

    this.referenceSpaceType = 'local-floor';
    this.report.tracking.referenceSpace = this.referenceSpaceType;

    session.addEventListener('inputsourceschange', () => this.syncInputDeclarations(session));
    session.addEventListener('end', () => {
      this.report.activeSession.state = 'inativo';
      this.report.tracking.viewer = 'fora de sessão';
      this.report.tracking.referenceSpace = 'nenhum';
      this.report.inputs = [];
      this.activeMode = null;
      this.touch();
    });

    this.syncInputDeclarations(session);
    this.touch();
  }

  private syncInputDeclarations(session: XRSession): void {
    this.report.inputs = Array.from(session.inputSources).map((source, index) => ({
      id: `${source.handedness || 'none'}-${index}`,
      handedness: source.handedness,
      targetRayMode: source.targetRayMode,
      profiles: [...source.profiles],
      hasGrip: Boolean(source.gripSpace),
      hasHandTracking: Boolean((source as XRInputSource & { hand?: unknown }).hand),
      degreesOfFreedom: 'aguardando pose',
    }));
    this.touch();
  }

  private emptyReport(): XRCapabilityReport {
    return {
      checkedAt: new Date().toISOString(),
      environment: {
        secureContext: window.isSecureContext,
        webXRApi: 'verificando',
        userAgent: navigator.userAgent,
      },
      modes: SESSION_MODES.map((mode) => ({ mode, state: 'verificando' })),
      activeSession: { mode: null, state: 'inativo', features: [] },
      tracking: { viewer: 'fora de sessão', referenceSpace: 'nenhum' },
      inputs: [],
    };
  }

  private touch(renderImmediately = true): void {
    this.report.checkedAt = new Date().toISOString();
    if (renderImmediately) this.render();
    else this.scheduleRender();
  }

  private renderPending = false;

  private scheduleRender(): void {
    if (this.renderPending) return;
    this.renderPending = true;
    window.setTimeout(() => {
      this.renderPending = false;
      this.render();
    }, 250);
  }

  private render(): void {
    if (!this.panel) return;
    const report = this.report;
    this.panel.replaceChildren();

    const header = element('header', 'report-header');
    header.append(
      element('div', 'eyebrow', 'SONDA DE CAPACIDADES'),
      element('h1', '', 'Relatório do dispositivo'),
      element('p', 'subtitle', report.environment.userAgent),
    );
    this.panel.append(header);

    const environment = element('section', 'report-card');
    environment.append(element('h2', '', 'Ambiente'));
    environment.append(row('Contexto seguro', report.environment.secureContext ? 'suportado' : 'não suportado'));
    environment.append(row('API WebXR', report.environment.webXRApi));
    this.panel.append(environment);

    const modes = element('section', 'report-card');
    modes.append(element('h2', '', 'Tipos de sessão'));
    report.modes.forEach((mode) => modes.append(row(MODE_LABELS[mode.mode], mode.state, mode.detail)));
    this.panel.append(modes);

    const controls = element('section', 'report-card');
    controls.append(element('h2', '', 'Consulta em sessão real'));
    controls.append(element('p', 'hint', 'Abra uma sessão para medir recursos concedidos, entradas e rastreamento.'));
    const buttons = element('div', 'probe-actions');
    buttons.append(
      sessionButton('Testar VR', 'immersive-vr', report, () => void this.requestSession('immersive-vr')),
      sessionButton('Testar AR', 'immersive-ar', report, () => void this.requestSession('immersive-ar')),
    );
    controls.append(buttons);
    if (report.lastError) controls.append(element('p', 'error-message', report.lastError));
    this.panel.append(controls);

    const session = element('section', 'report-card');
    session.append(element('h2', '', 'Sessão ativa'));
    session.append(row('Estado', report.activeSession.state));
    session.append(row('Modo', report.activeSession.mode ? MODE_LABELS[report.activeSession.mode] : 'nenhum'));
    session.append(row('Referência', report.tracking.referenceSpace));
    session.append(row('Rastreamento do visor', report.tracking.viewer));
    report.activeSession.features.forEach((feature) => {
      session.append(row(feature.name, feature.state, feature.detail));
    });
    this.panel.append(session);

    const inputs = element('section', 'report-card');
    inputs.append(element('h2', '', `Fontes de entrada (${report.inputs.length})`));
    if (report.inputs.length === 0) {
      inputs.append(element('p', 'hint', 'Nenhuma fonte declarada. Fora de uma sessão isso é esperado.'));
    } else {
      report.inputs.forEach((input) => {
        const item = element('article', 'input-source');
        item.append(element('h3', '', input.profiles.join(', ') || 'perfil não declarado'));
        item.append(
          element('p', '', `Mão: ${input.handedness || 'nenhuma'} · Raio: ${input.targetRayMode}`),
          element('p', '', `Rastreamento: ${input.degreesOfFreedom} · Grip: ${yesNo(input.hasGrip)} · Mãos: ${yesNo(input.hasHandTracking)}`),
        );
        inputs.append(item);
      });
    }
    this.panel.append(inputs);

    this.panel.append(element('p', 'timestamp', `Atualizado: ${new Date(report.checkedAt).toLocaleString('pt-BR')}`));
  }
}

function classifySessionFailure(error: unknown): { state: CapabilityState; detail: string } {
  if (error instanceof DOMException) {
    if (error.name === 'NotSupportedError') {
      return { state: 'não suportado', detail: `${error.name}: ${error.message}` };
    }
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
      return { state: 'negado', detail: `${error.name}: ${error.message}` };
    }
    return { state: 'erro', detail: `${error.name}: ${error.message}` };
  }
  return { state: 'erro', detail: error instanceof Error ? error.message : String(error) };
}

function element(tag: string, className = '', text?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function row(label: string, state: string, detail?: string): HTMLElement {
  const item = element('div', 'report-row');
  const copy = element('div');
  copy.append(element('strong', '', label));
  if (detail) copy.append(element('small', '', detail));
  const badge = element('span', `status status-${slug(state)}`, state);
  item.append(copy, badge);
  return item;
}

function sessionButton(
  label: string,
  mode: 'immersive-vr' | 'immersive-ar',
  report: XRCapabilityReport,
  onClick: () => void,
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  const modeState = report.modes.find((item) => item.mode === mode)?.state;
  button.disabled = modeState !== 'suportado' || report.activeSession.state === 'ativo';
  button.addEventListener('click', onClick);
  return button;
}

function slug(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

function yesNo(value: boolean): string {
  return value ? 'sim' : 'não';
}

export const capabilityProbe = new XRCapabilityProbe();
