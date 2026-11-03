import type { AppState } from '../domain/model';
export interface AnalysisRepository {
  load(): AppState | null;
  save(state: AppState): void;
}
