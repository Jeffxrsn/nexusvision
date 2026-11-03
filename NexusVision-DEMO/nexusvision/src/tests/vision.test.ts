import { describe, expect, it } from 'vitest';
import { DemoVisionAdapter } from '../infrastructure/vision/DemoVisionAdapter';
import { scenarios } from '../modules/scenarios/data/scenarios';
import { resultSchema } from '../core/domain/model';

describe('Motor de demostración', () => {
  const engine = new DemoVisionAdapter(0);
  it.each(scenarios.map((s) => s.id))(
    'produce resultados válidos y reproducibles: %s',
    async (id) => {
      const input = { scenarioId: id, sourceKind: 'scenario' as const, mode: 'combined' as const };
      const first = await engine.analyze(input),
        second = await engine.analyze(input);
      expect(first).toEqual(second);
      expect(resultSchema.safeParse(first).success).toBe(true);
      first.detections[0].label = 'cambiado';
      expect(second.detections[0].label).not.toBe('cambiado');
      for (const d of second.detections) {
        expect(d.box.x + d.box.width).toBeLessThanOrEqual(1);
        expect(d.box.y + d.box.height).toBeLessThanOrEqual(1);
      }
    },
  );
  it('no inventa detecciones para una imagen propia', async () => {
    expect(
      await engine.analyze({ scenarioId: null, sourceKind: 'upload', mode: 'combined' }),
    ).toEqual({ detections: [], masks: [], patterns: [], durationMs: 0 });
  });
  it('rechaza escenarios desconocidos', async () => {
    await expect(
      engine.analyze({ scenarioId: 'unknown', sourceKind: 'scenario', mode: 'combined' }),
    ).rejects.toThrow();
  });
  it('respeta perfiles de detección y segmentación', async () => {
    const d = await engine.analyze({
      scenarioId: 'industrial',
      sourceKind: 'scenario',
      mode: 'detection',
    });
    expect(d.detections).toHaveLength(5);
    expect(d.patterns).toHaveLength(0);
    expect(d.masks).toHaveLength(0);
    const s = await engine.analyze({
      scenarioId: 'industrial',
      sourceKind: 'scenario',
      mode: 'segmentation',
    });
    expect(s.masks).toHaveLength(2);
    expect(s.detections).toHaveLength(0);
    expect(s.patterns).toHaveLength(0);
  });
});
