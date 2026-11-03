import type { AnalysisInput, VisionEngine } from '../../core/ports/VisionEngine';
import type { VisionResult } from '../../core/domain/model';
import { scenarioById } from '../../modules/scenarios/data/scenarios';

/** No modelo entrenado: los resultados proceden de plantillas calibradas para SVG locales. */
export class DemoVisionAdapter implements VisionEngine {
  constructor(private readonly delayMs = 380) {}
  async analyze(
    input: AnalysisInput,
    onProgress?: (n: number, label: string) => void,
  ): Promise<VisionResult> {
    const source = input.sourceKind === 'scenario' ? scenarioById(input.scenarioId) : null;
    if (input.sourceKind === 'scenario' && !source)
      throw new Error('Selecciona un escenario disponible.');
    const steps = [
      'Validando entrada',
      'Preparando demostración',
      'Cargando resultados de ejemplo',
      'Aplicando reglas',
    ];
    for (let i = 0; i < steps.length; i++) {
      onProgress?.((i + 1) * 25, steps[i]);
      if (this.delayMs > 0) await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }
    // Archivos propios se validan y registran sin inventar detecciones.
    if (!source) return { detections: [], masks: [], patterns: [], durationMs: 0 };
    const result = structuredClone(source.result);
    if (input.mode === 'detection') {
      result.masks = [];
      result.patterns = [];
    }
    if (input.mode === 'segmentation') {
      result.detections = [];
      result.patterns = [];
    }
    if (input.mode === 'patterns') {
      result.masks = [];
    }
    return result;
  }
}
