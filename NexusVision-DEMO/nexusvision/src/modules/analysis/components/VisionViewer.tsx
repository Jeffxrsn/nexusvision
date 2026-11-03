import { useEffect, useState } from 'react';
import { Layers, ScanLine, MapPin, ImageOff } from 'lucide-react';
import type { Analysis, Box } from '../../../core/domain/model';
import { useApp } from '../../../app/providers/AppProvider';
import { assetUrl, percent } from '../../../shared/ui';
import { scenarioById } from '../../scenarios/data/scenarios';

export function VisionViewer({
  scenarioId,
  analysis,
  threshold = 0.75,
  classId = '',
  selected = '',
  uploadUrl,
  zone,
}: {
  scenarioId: string | null;
  analysis?: Analysis;
  threshold?: number;
  classId?: string;
  selected?: string;
  uploadUrl?: string;
  zone?: Box;
}) {
  const { state } = useApp();
  const [boxes, setBoxes] = useState(true),
    [masks, setMasks] = useState(false),
    [zones, setZones] = useState(true);
  useEffect(() => {
    if (analysis?.mode === 'segmentation') {
      setMasks(true);
      setBoxes(false);
    } else {
      setMasks(false);
      setBoxes(true);
    }
  }, [analysis?.id, analysis?.mode]);
  const source = analysis?.sourceKind === 'upload' ? null : scenarioById(scenarioId);
  const image = uploadUrl || (source ? assetUrl(source.asset) : null);
  const classes = state.classes;
  const visible = (c: { classId: string; confidence: number }) =>
    c.confidence >= threshold &&
    (!classId || c.classId === classId) &&
    classes.some((t) => t.id === c.classId && t.enabled);
  const color = (id: string) => classes.find((c) => c.id === id)?.color ?? '#6dd9d1';
  return (
    <div className="vision-viewer">
      <div className="viewer-toolbar">
        <span className="viewer-title">
          <span className="status-dot" />
          VISTA DE ANÁLISIS
        </span>
        <div className="viewer-tools">
          <button
            aria-pressed={boxes}
            className={boxes ? 'selected' : ''}
            onClick={() => setBoxes(!boxes)}
          >
            <ScanLine size={15} />
            Cajas
          </button>
          <button
            aria-pressed={masks}
            className={masks ? 'selected' : ''}
            onClick={() => setMasks(!masks)}
          >
            <Layers size={15} />
            Máscaras
          </button>
          {zone && (
            <button
              aria-pressed={zones}
              className={zones ? 'selected' : ''}
              onClick={() => setZones(!zones)}
            >
              <MapPin size={15} />
              Zona
            </button>
          )}
        </div>
      </div>
      <div className="scene-frame">
        {image ? (
          <img
            src={image}
            alt={
              source
                ? `Escena ilustrada: ${source.name}. Resultados predefinidos de demostración.`
                : 'Imagen propia; sin inferencia de IA.'
            }
          />
        ) : (
          <div className="image-missing">
            <ImageOff size={38} />
            <strong>Imagen local no conservada</strong>
            <span>El historial guarda los metadatos, no el archivo original.</span>
          </div>
        )}
        {source && (
          <svg className="vision-overlay" viewBox="0 0 1000 600" aria-hidden="true">
            {zones && zone && (
              <g>
                <rect
                  x={zone.x * 1000}
                  y={zone.y * 600}
                  width={zone.width * 1000}
                  height={zone.height * 600}
                  fill="#efa64c"
                  fillOpacity=".06"
                  stroke="#edb14c"
                  strokeWidth="2"
                  strokeDasharray="8 5"
                />
                <text x={zone.x * 1000 + 8} y={zone.y * 600 + 18} fill="#ffd793" fontSize="12">
                  ZONA RESTRINGIDA · DEMO
                </text>
              </g>
            )}
            {masks &&
              analysis?.result.masks
                .filter(visible)
                .map((m) => (
                  <polygon
                    key={m.id}
                    points={m.points.map(([x, y]) => `${x * 1000},${y * 600}`).join(' ')}
                    fill={color(m.classId)}
                    fillOpacity=".35"
                    stroke={color(m.classId)}
                    strokeWidth="2"
                  />
                ))}
            {boxes &&
              analysis?.result.detections.filter(visible).map((d) => (
                <g key={d.id} opacity={selected && selected !== d.id ? 0.3 : 1}>
                  <rect
                    x={d.box.x * 1000}
                    y={d.box.y * 600}
                    width={d.box.width * 1000}
                    height={d.box.height * 600}
                    rx="2"
                    fill={color(d.classId)}
                    fillOpacity={selected === d.id ? 0.18 : 0.04}
                    stroke={color(d.classId)}
                    strokeWidth={selected === d.id ? 4 : 2}
                  />
                  <rect
                    x={d.box.x * 1000}
                    y={Math.max(0, d.box.y * 600 - 25)}
                    width={Math.min(200, 75 + d.label.length * 6)}
                    height="23"
                    rx="3"
                    fill={color(d.classId)}
                  />
                  <text
                    x={d.box.x * 1000 + 7}
                    y={Math.max(16, d.box.y * 600 - 9)}
                    fill="#072435"
                    fontFamily="sans-serif"
                    fontWeight="700"
                    fontSize="13"
                  >
                    {d.label} · {percent(d.confidence)}
                  </text>
                </g>
              ))}
          </svg>
        )}
        <span className="scene-corner">
          {source ? 'ESCENA CALIBRADA' : 'ARCHIVO LOCAL'}
          <b>DEMO</b>
        </span>
      </div>
      <div className="viewer-footer">
        <span>
          <i className="status-dot" />{' '}
          {analysis?.status === 'completed' ? 'Resultados disponibles' : 'Entrada preparada'}
        </span>
        <span>Coordenadas normalizadas · 0–1</span>
      </div>
    </div>
  );
}
