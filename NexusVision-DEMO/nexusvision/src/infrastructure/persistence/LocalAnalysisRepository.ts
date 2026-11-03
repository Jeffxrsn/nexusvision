import type { AnalysisRepository } from '../../core/ports/AnalysisRepository';
import { stateSchema, type AppState } from '../../core/domain/model';
export const STORAGE_KEY = 'nexusvision.demo.v1';
export class LocalAnalysisRepository implements AnalysisRepository {
  constructor(private readonly storage: Pick<Storage, 'getItem' | 'setItem'>) {}
  load(): AppState | null {
    const raw = this.storage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    try {
      const state = stateSchema.parse(JSON.parse(raw));
      // A browser refresh interrupts jobs; never leave them permanently processing.
      return {
        ...state,
        analyses: state.analyses.map((a) =>
          a.status === 'processing'
            ? {
                ...a,
                status: 'failed',
                error: 'El análisis se interrumpió al cerrar la sesión. Vuelve a ejecutarlo.',
              }
            : a,
        ),
      };
    } catch {
      throw new Error(
        'Los datos locales no se pudieron leer. Usa Restablecer demo en Configuración para recuperarlos.',
      );
    }
  }
  save(state: AppState): void {
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(stateSchema.parse(state)));
    } catch {
      throw new Error(
        'No se pudieron guardar los cambios en este navegador. Libera espacio o permite el almacenamiento local y reintenta.',
      );
    }
  }
}
