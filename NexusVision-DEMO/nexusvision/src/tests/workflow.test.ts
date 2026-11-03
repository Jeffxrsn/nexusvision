import { describe, expect, it, vi } from 'vitest';
import {
  completeAnalysis,
  dashboard,
  emptyState,
  evaluateRules,
  reviewAlert,
  seedState,
  startAnalysis,
  updateConfiguration,
  updateRule,
  uid,
} from '../core/application/operations';
import { stateSchema, type Session } from '../core/domain/model';
import { scenarios } from '../modules/scenarios/data/scenarios';
const admin: Session = { name: 'Pruebas', role: 'admin' };
const input = {
  sourceKind: 'scenario' as const,
  scenarioId: 'industrial',
  sourceName: 'Seguridad industrial',
  mode: 'combined' as const,
};
function completed(scenario = 'industrial') {
  const state = emptyState(),
    s = scenarios.find((x) => x.id === scenario)!;
  const row = startAnalysis(state, { ...input, scenarioId: scenario }, admin);
  state.analyses = [row];
  return completeAnalysis(state, row, structuredClone(s.result), admin);
}
describe('Flujo de análisis y métricas', () => {
  it('genera UUID en vistas HTTP sin crypto.randomUUID', () => {
    const getRandomValues = crypto.getRandomValues.bind(crypto);
    vi.stubGlobal('crypto', { getRandomValues });
    try {
      expect(uid()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
      expect(uid()).not.toBe(uid());
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it('guarda resultados brutos, genera alerta y deriva KPI del registro', () => {
    const state = completed();
    expect(stateSchema.safeParse(state).success).toBe(true);
    expect(state.analyses[0].status).toBe('completed');
    expect(state.analyses[0].result.detections).toHaveLength(5);
    expect(state.analyses[0].result.detections.some((d) => d.confidence < 0.75)).toBe(true);
    expect(state.alerts).toHaveLength(1);
    expect(dashboard(state, 7).detections).toHaveLength(5);
    expect(state.events).toHaveLength(1);
  });
  it('genera semilla coherente y sin registros futuros', () => {
    const now = new Date('2026-11-03T04:00:00Z'),
      state = seedState(now);
    expect(stateSchema.safeParse(state).success).toBe(true);
    expect(state.analyses).toHaveLength(16);
    expect(state.analyses.every((a) => new Date(a.createdAt) <= now)).toBe(true);
    expect(dashboard(state, 7, now).analyses).toHaveLength(16);
  });
  it('calcula estado vacío sin NaN', () => {
    const stats = dashboard(emptyState(), 7);
    expect(stats.meanConfidence).toBe(0);
    expect(stats.meanDuration).toBe(0);
    expect(stats.series.every((d) => d.value === 0)).toBe(true);
  });
  it('las reglas desactivadas o de alta confianza no generan alertas', () => {
    const state = completed();
    const row = state.analyses[0];
    expect(
      evaluateRules(
        row,
        state.rules.map((r) => ({ ...r, enabled: false })),
      ),
    ).toHaveLength(0);
    expect(
      evaluateRules(
        row,
        state.rules.map((r) => ({ ...r, threshold: 0.99 })),
      ),
    ).toHaveLength(0);
  });
  it('la zona configurable y las clases afectan nuevas alertas', () => {
    const state = completed('warehouse'),
      row = state.analyses[0];
    expect(state.alerts).toHaveLength(1);
    expect(
      evaluateRules(
        row,
        state.rules.map((r) => ({ ...r, zone: { x: 0, y: 0, width: 0.1, height: 0.1 } })),
      ),
    ).toHaveLength(0);
    expect(
      evaluateRules(
        row,
        state.rules,
        state.classes.map((c) => ({ ...c, enabled: false })),
      ),
    ).toHaveLength(0);
  });
  it('el umbral general y el límite de afluencia se respetan', () => {
    const state = completed('retail');
    expect(state.alerts).toHaveLength(1);
    expect(
      evaluateRules(
        state.analyses[0],
        state.rules.map((r) => ({ ...r, minCount: 4 })),
      ),
    ).toHaveLength(0);
    expect(evaluateRules({ ...state.analyses[0], threshold: 0.99 }, state.rules)).toHaveLength(0);
  });
});
describe('Perfiles y trazabilidad', () => {
  it('bloquea análisis de auditores y escenarios deshabilitados', () => {
    expect(() => startAnalysis(emptyState(), input, { ...admin, role: 'auditor' })).toThrow();
    const state = emptyState();
    state.scenarios[0].enabled = false;
    expect(() => startAnalysis(state, input, admin)).toThrow();
  });
  it('solo supervisor y administrador revisan, con nota y transiciones válidas', () => {
    const state = completed(),
      id = state.alerts[0].id;
    expect(() =>
      reviewAlert(state, id, 'reviewed', 'Nota', { ...admin, role: 'operator' }),
    ).toThrow();
    expect(() => reviewAlert(state, id, 'reviewed', '', admin)).toThrow();
    expect(() => reviewAlert(state, id, 'closed', 'Nota', admin)).toThrow();
    const reviewed = reviewAlert(state, id, 'reviewed', 'Revisada visualmente', {
      name: 'Supervisor',
      role: 'supervisor',
    });
    expect(reviewed.alerts[0].reviewedBy).toBe('Supervisor');
    expect(dashboard(reviewed, 7).activeAlerts).toHaveLength(1);
    const closed = reviewAlert(reviewed, id, 'closed', 'Caso de ejemplo cerrado', admin);
    expect(dashboard(closed, 7).activeAlerts).toHaveLength(0);
    expect(closed.events[0].action).toContain('cerrado');
    expect(() => reviewAlert(closed, id, 'reviewed', 'Abrir', admin)).toThrow();
  });
  it('solo admin configura y conserva alertas históricas', () => {
    const state = completed(),
      rule = { ...state.rules[0], enabled: false };
    expect(() => updateRule(state, rule, { ...admin, role: 'supervisor' })).toThrow();
    const updated = updateRule(state, rule, admin);
    expect(updated.alerts).toEqual(state.alerts);
    expect(() =>
      updateRule(state, { ...rule, zone: { x: 0.9, y: 0, width: 0.3, height: 0.3 } }, admin),
    ).toThrow();
    expect(() =>
      updateConfiguration(
        state,
        { threshold: 0.5, classes: state.classes, scenarios: state.scenarios },
        { ...admin, role: 'operator' },
      ),
    ).toThrow();
  });
});
