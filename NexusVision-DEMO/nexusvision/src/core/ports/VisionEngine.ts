import type { AnalysisMode, VisionResult } from '../domain/model';

export interface AnalysisInput {
  scenarioId: string | null;
  sourceKind: 'scenario' | 'upload';
  mode: AnalysisMode;
}
export interface VisionEngine {
  analyze(
    input: AnalysisInput,
    onProgress?: (progress: number, label: string) => void,
  ): Promise<VisionResult>;
}
