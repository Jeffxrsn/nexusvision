import {
  canAnalyze,
  canConfigure,
  canReview,
  ruleSchema,
  scenarioConfigSchema,
  classSchema,
  type Alert,
  type Analysis,
  type AppState,
  type Rule,
  type Session,
  type VisionResult,
} from '../domain/model';
import { initialClasses, initialRules, scenarios } from '../../modules/scenarios/data/scenarios';
import type { AnalysisInput } from '../ports/VisionEngine';

export function uid(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // randomUUID requires a secure context; getRandomValues also works on local HTTP previews.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
export function requireRole(ok: boolean) {
  if (!ok) throw new Error('Tu perfil de demostración no permite esta acción.');
}
export function audit(state: AppState, session: Session, action: string, target: string): AppState {
  return {
    ...state,
    events: [
      {
        id: uid(),
        at: new Date().toISOString(),
        actor: `${session.name} · ${session.role}`,
        action,
        target,
      },
      ...state.events,
    ].slice(0, 500),
  };
}
export function startAnalysis(
  state: AppState,
  input: AnalysisInput & { sourceName: string },
  session: Session,
): Analysis {
  requireRole(canAnalyze(session.role));
  if (
    input.sourceKind === 'scenario' &&
    !state.scenarios.some((s) => s.id === input.scenarioId && s.enabled)
  )
    throw new Error('Este escenario está deshabilitado. Selecciona otro.');
  return {
    id: uid(),
    createdAt: new Date().toISOString(),
    createdBy: session.name,
    sourceName: input.sourceName.slice(0, 180),
    sourceKind: input.sourceKind,
    scenarioId: input.scenarioId,
    mode: input.mode,
    status: 'processing',
    threshold: state.threshold,
    averageConfidence: 0,
    result: { detections: [], masks: [], patterns: [], durationMs: 0 },
    seeded: false,
  };
}
export function evaluateRules(
  analysis: Analysis,
  rules: Rule[],
  classes = initialClasses,
): Alert[] {
  const active = analysis.result.detections.filter(
    (d) =>
      d.confidence >= analysis.threshold && classes.some((c) => c.id === d.classId && c.enabled),
  );
  return rules.flatMap((rule) => {
    if (!rule.enabled) return [];
    const pattern = analysis.result.patterns.find(
      (p) =>
        p.type === rule.condition && p.confidence >= Math.max(rule.threshold, analysis.threshold),
    );
    if (!pattern) return [];
    if (rule.condition === 'missing_ppe' && !active.some((d) => d.classId === 'person')) return [];
    if (rule.condition === 'surface_defect' && !active.some((d) => d.classId === 'defect'))
      return [];
    if (
      rule.condition === 'congestion' &&
      active.filter((d) => d.classId === 'person').length < rule.minCount
    )
      return [];
    if (
      rule.condition === 'restricted_zone' &&
      !active.some((d) => {
        const cx = d.box.x + d.box.width / 2,
          cy = d.box.y + d.box.height / 2,
          z = rule.zone;
        return (
          d.classId === 'forklift' &&
          cx >= z.x &&
          cx <= z.x + z.width &&
          cy >= z.y &&
          cy <= z.y + z.height
        );
      })
    )
      return [];
    return [
      {
        id: `${analysis.id}-${rule.id}`,
        analysisId: analysis.id,
        ruleId: rule.id,
        severity: rule.severity,
        message: rule.name,
        evidence: pattern.evidence,
        confidence: pattern.confidence,
        status: 'new' as const,
        createdAt: analysis.createdAt,
        updatedAt: analysis.createdAt,
        reviewedBy: null,
        note: '',
      },
    ];
  });
}
export function completeAnalysis(
  state: AppState,
  pending: Analysis,
  result: VisionResult,
  session: Session,
): AppState {
  const confidences = [...result.detections, ...result.masks, ...result.patterns].map(
    (d) => d.confidence,
  );
  const completed: Analysis = {
    ...pending,
    status: 'completed',
    result,
    averageConfidence: confidences.length
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0,
  };
  return audit(
    {
      ...state,
      analyses: state.analyses.map((a) => (a.id === pending.id ? completed : a)),
      alerts: [...evaluateRules(completed, state.rules, state.classes), ...state.alerts],
    },
    session,
    'Análisis completado · DEMO',
    pending.id,
  );
}
export function reviewAlert(
  state: AppState,
  id: string,
  status: Alert['status'],
  note: string,
  session: Session,
): AppState {
  requireRole(canReview(session.role));
  const target = state.alerts.find((a) => a.id === id);
  if (!target) throw new Error('La alerta ya no está disponible.');
  if (
    (target.status === 'new' && status !== 'reviewed') ||
    (target.status === 'reviewed' && status !== 'closed') ||
    target.status === 'closed'
  )
    throw new Error('Primero revisa la alerta; después puedes cerrarla.');
  if (!note.trim()) throw new Error('Escribe una observación para conservar la trazabilidad.');
  return audit(
    {
      ...state,
      alerts: state.alerts.map((a) =>
        a.id === id
          ? {
              ...a,
              status,
              reviewedBy: session.name,
              note: note.trim().slice(0, 500),
              updatedAt: new Date().toISOString(),
            }
          : a,
      ),
    },
    session,
    `${status === 'reviewed' ? 'Revisión' : 'Cierre'} de alerta: ${note.trim().slice(0, 500)}`,
    id,
  );
}
export function updateRule(state: AppState, value: Rule, session: Session): AppState {
  requireRole(canConfigure(session.role));
  const parsed = ruleSchema.parse(value);
  return audit(
    { ...state, rules: state.rules.map((r) => (r.id === parsed.id ? parsed : r)) },
    session,
    'Regla actualizada',
    parsed.name,
  );
}
export function updateConfiguration(
  state: AppState,
  value: Pick<AppState, 'threshold' | 'classes' | 'scenarios'>,
  session: Session,
): AppState {
  requireRole(canConfigure(session.role));
  if (!Number.isFinite(value.threshold) || value.threshold < 0 || value.threshold > 1)
    throw new Error('Umbral fuera de rango.');
  const classes = classSchema.array().parse(value.classes),
    scenarioConfigs = scenarioConfigSchema.array().parse(value.scenarios);
  return audit(
    { ...state, threshold: value.threshold, classes, scenarios: scenarioConfigs },
    session,
    'Configuración actualizada',
    'Preferencias, clases y escenarios',
  );
}
export function emptyState(): AppState {
  return {
    version: 1,
    analyses: [],
    alerts: [],
    rules: structuredClone(initialRules),
    classes: structuredClone(initialClasses),
    scenarios: scenarios.map(({ id, name, description, enabled }) => ({
      id,
      name,
      description,
      enabled,
    })),
    events: [],
    threshold: 0.75,
  };
}
export function seedState(now = new Date()): AppState {
  const state = emptyState();
  for (let day = 6; day >= 0; day--) {
    const count = [2, 1, 3, 2, 3, 2, 3][6 - day];
    for (let j = 0; j < count; j++) {
      const s = scenarios[(day + j) % scenarios.length];
      const date = new Date(now);
      date.setDate(date.getDate() - day);
      date.setHours(9 + j, 15, 0, 0);
      // Today's demonstration entries must not appear in the future.
      const createdAt = new Date(
        Math.min(date.getTime(), now.getTime() - (j + 1) * 60000),
      ).toISOString();
      const a: Analysis = {
        id: `demo-${day}-${j}`,
        createdAt,
        createdBy: 'Equipo DEMO',
        sourceName: s.name,
        scenarioId: s.id,
        sourceKind: 'scenario',
        mode: 'combined',
        status: 'completed',
        threshold: 0.75,
        averageConfidence:
          [...s.result.detections, ...s.result.masks, ...s.result.patterns].reduce(
            (n, d) => n + d.confidence,
            0,
          ) /
          (s.result.detections.length + s.result.masks.length + s.result.patterns.length),
        result: structuredClone(s.result),
        seeded: true,
      };
      state.analyses.unshift(a);
      state.alerts.push(
        ...evaluateRules(a, state.rules).map((alert) =>
          day > 2
            ? {
                ...alert,
                status: 'closed' as const,
                reviewedBy: 'Supervisor DEMO',
                note: 'Ejemplo de revisión de un registro semilla.',
              }
            : alert,
        ),
      );
    }
  }
  state.analyses.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  state.alerts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return state;
}
export function dashboard(state: AppState, days: number, now = new Date()) {
  const start = new Date(now);
  start.setDate(start.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);
  const analyses = state.analyses.filter(
    (a) =>
      a.status === 'completed' && new Date(a.createdAt) >= start && new Date(a.createdAt) <= now,
  );
  const ids = new Set(analyses.map((a) => a.id));
  const detections = analyses.flatMap((a) => a.result.detections);
  const alerts = state.alerts.filter((a) => ids.has(a.analysisId));
  const series = Array.from({ length: days }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return {
      date: d.toISOString(),
      label: d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }),
      value: analyses.filter((a) => new Date(a.createdAt).toDateString() === d.toDateString())
        .length,
    };
  });
  return {
    analyses,
    detections,
    alerts,
    activeAlerts: alerts.filter((a) => a.status !== 'closed'),
    meanConfidence: detections.length
      ? detections.reduce((a, d) => a + d.confidence, 0) / detections.length
      : 0,
    meanDuration: analyses.length
      ? analyses.reduce((a, d) => a + d.result.durationMs, 0) / analyses.length
      : 0,
    series,
    distribution: state.classes
      .map((c) => ({ ...c, count: detections.filter((d) => d.classId === c.id).length }))
      .filter((c) => c.count > 0),
  };
}
