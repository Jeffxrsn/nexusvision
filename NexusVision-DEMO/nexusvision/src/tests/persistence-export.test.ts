import { describe, expect, it } from 'vitest';
import {
  LocalAnalysisRepository,
  STORAGE_KEY,
} from '../infrastructure/persistence/LocalAnalysisRepository';
import { csvCell, analysisCsv } from '../infrastructure/export/csv';
import { emptyState, seedState, startAnalysis } from '../core/application/operations';
import { validateImage, MAX_IMAGE_SIZE } from '../modules/analysis/validators/image';

function memory() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => {
      data.set(k, v);
    },
  };
}
describe('Persistencia y CSV', () => {
  it('conserva análisis y revisiones al cargar otra instancia', () => {
    const storage = memory(),
      repo = new LocalAnalysisRepository(storage),
      state = seedState();
    repo.save(state);
    expect(new LocalAnalysisRepository(storage).load()).toEqual(state);
  });
  it('recupera trabajos interrumpidos como errores accionables', () => {
    const state = emptyState();
    state.analyses = [
      startAnalysis(
        state,
        { sourceKind: 'scenario', scenarioId: 'industrial', sourceName: 'Demo', mode: 'combined' },
        { name: 'Demo', role: 'admin' },
      ),
    ];
    const repo = new LocalAnalysisRepository(memory());
    repo.save(state);
    expect(repo.load()?.analyses[0].status).toBe('failed');
  });
  it('detecta almacenamiento corrupto y lleno sin ignorar el error', () => {
    const storage = memory();
    storage.setItem(STORAGE_KEY, '{"version":100}');
    expect(() => new LocalAnalysisRepository(storage).load()).toThrow(/no se pudieron leer/);
    expect(storage.getItem(STORAGE_KEY)).toBe('{"version":100}');
    expect(() =>
      new LocalAnalysisRepository({
        getItem: () => null,
        setItem: () => {
          throw Error('quota');
        },
      }).save(emptyState()),
    ).toThrow(/guardar/);
  });
  it('escapa comillas, comas, saltos y fórmulas en reportes', () => {
    expect(csvCell('a,"b"\nc')).toBe('"a,""b""\nc"');
    for (const x of ['=HYPERLINK("x")', '+SUM(1)', ' -1', '@cmd', '\t=1'])
      expect(csvCell(x)).toMatch(/^"'/);
  });
  it('exporta identificadores, clases, confianza, estados y modo DEMO', () => {
    const rows = seedState().analyses.slice(0, 1),
      csv = analysisCsv(rows);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"DEMO"');
    expect(csv).toContain(rows[0].id);
    expect(csv).toContain('"completed"');
    expect(csv.split('\r\n')).toHaveLength(rows[0].result.detections.length + 1);
  });
});
describe('Validación de imágenes', () => {
  it('acepta una firma PNG coherente', async () => {
    await expect(
      validateImage(
        new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], 'escena.png', {
          type: 'image/png',
        }),
      ),
    ).resolves.toBeUndefined();
  });
  it('rechaza MIME falso, contenido renombrado, archivos vacíos y más de 10 MB', async () => {
    await expect(
      validateImage(new File(['contenido'], 'archivo.png', { type: 'image/png' })),
    ).rejects.toThrow(/contenido/);
    await expect(
      validateImage(new File(['x'], 'script.svg', { type: 'image/svg+xml' })),
    ).rejects.toThrow(/JPG o PNG/);
    await expect(validateImage(new File([], 'empty.jpg', { type: 'image/jpeg' }))).rejects.toThrow(
      /10 MB/,
    );
    const large = new File([new Uint8Array(MAX_IMAGE_SIZE + 1)], 'grande.jpg', {
      type: 'image/jpeg',
    });
    await expect(validateImage(large)).rejects.toThrow(/10 MB/);
  });
});
