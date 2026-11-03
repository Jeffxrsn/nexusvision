import type { Analysis } from '../../core/domain/model';
// Protect spreadsheets against formula injection, including leading whitespace.
export function csvCell(value: unknown): string {
  let text = String(value ?? '');
  if (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function analysisCsv(analyses: Analysis[]): string {
  const rows: unknown[][] = [
    [
      'modo_sistema',
      'id',
      'fecha',
      'usuario',
      'origen',
      'escenario',
      'perfil',
      'clase',
      'confianza',
      'estado',
      'dato_semilla',
      'duracion_demo_ms',
    ],
  ];
  for (const a of analyses)
    for (const d of a.result.detections.length ? a.result.detections : [null])
      rows.push([
        'DEMO',
        a.id,
        a.createdAt,
        a.createdBy,
        a.sourceName,
        a.scenarioId ?? 'imagen_local_sin_inferencia',
        a.mode,
        d?.label ?? '',
        d ? (d.confidence * 100).toFixed(1) : '',
        a.status,
        a.seeded ? 'sí' : 'no',
        a.result.durationMs,
      ]);
  return '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
}
export function downloadCsv(csv: string, name = 'nexusvision-reporte-demo.csv') {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
