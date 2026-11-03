import { useEffect, useRef, useState } from 'react';
import {
  Play,
  Upload,
  Download,
  ScanLine,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useApp } from '../../../app/providers/AppProvider';
import { canAnalyze, modeLabels, type AnalysisMode } from '../../../core/domain/model';
import { Badge, Empty, PageHeading, percent, shortId } from '../../../shared/ui';
import { scenarios } from '../../scenarios/data/scenarios';
import { VisionViewer } from '../components/VisionViewer';
import { loadImage } from '../validators/image';

export function AnalysisPage({ query }: { query: URLSearchParams }) {
  const { state, session, run, busy, progress, exportAnalyses, notify } = useApp();
  const requested = query.get('scenario');
  const existing = state.analyses.find((a) => a.id === query.get('id'));
  const [scenarioId, setScenarioId] = useState(
    existing?.scenarioId ??
      (requested && scenarios.some((s) => s.id === requested)
        ? requested
        : (state.scenarios.find((s) => s.enabled)?.id ?? 'industrial')),
  );
  const [mode, setMode] = useState<AnalysisMode>(existing?.mode ?? 'combined'),
    [resultId, setResultId] = useState(query.get('id') ?? '');
  const [tab, setTab] = useState(
      existing?.mode === 'segmentation'
        ? 'masks'
        : existing?.mode === 'patterns'
          ? 'patterns'
          : 'detections',
    ),
    [threshold, setThreshold] = useState(existing?.threshold ?? state.threshold),
    [classId, setClassId] = useState(''),
    [selected, setSelected] = useState('');
  const [upload, setUpload] = useState<{ name: string; url: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadToken = useRef(0);
  const analysis = state.analyses.find((a) => a.id === resultId);
  useEffect(
    () => () => {
      if (upload) URL.revokeObjectURL(upload.url);
    },
    [upload],
  );
  useEffect(
    () => () => {
      uploadToken.current++;
    },
    [],
  );
  const sourceScenario = analysis ? analysis.scenarioId : upload ? null : scenarioId;
  const zone =
    sourceScenario === 'warehouse'
      ? state.rules.find((r) => r.condition === 'restricted_zone')?.zone
      : undefined;
  const visible = (r: { classId: string; confidence: number }) =>
    r.confidence >= threshold &&
    (!classId || classId === r.classId) &&
    state.classes.some((c) => c.id === r.classId && c.enabled);
  const detections = analysis?.result.detections.filter(visible) ?? [],
    masks = analysis?.result.masks.filter(visible) ?? [],
    patterns = analysis?.result.patterns.filter((p) => p.confidence >= threshold) ?? [];
  const load = async (file?: File) => {
    if (!file) return;
    const token = ++uploadToken.current;
    try {
      const url = await loadImage(file);
      if (token !== uploadToken.current) {
        URL.revokeObjectURL(url);
        return;
      }
      setUpload({ name: file.name, url });
      setResultId('');
      notify(
        'Imagen preparada. El modo DEMO no ejecuta inferencia sobre archivos propios.',
        'info',
      );
    } catch (e) {
      notify((e as Error).message, 'error');
    }
  };
  const execute = async () => {
    setSelected('');
    const id = await run({
      scenarioId: upload ? null : scenarioId,
      sourceKind: upload ? 'upload' : 'scenario',
      sourceName:
        upload?.name ?? state.scenarios.find((s) => s.id === scenarioId)?.name ?? scenarioId,
      mode,
    });
    if (id) {
      setResultId(id);
      setThreshold(state.threshold);
      setTab(mode === 'segmentation' ? 'masks' : mode === 'patterns' ? 'patterns' : 'detections');
    }
  };
  return (
    <>
      <PageHeading
        eyebrow="DE LA IMAGEN A LA INFORMACIÓN"
        title="Centro de análisis"
        description="Explora detecciones, regiones y patrones en una misma vista."
      >
        {analysis && (
          <button className="button" onClick={() => exportAnalyses([analysis])}>
            <Download size={16} />
            Exportar resultado
          </button>
        )}
      </PageHeading>
      <div className="analysis-control card">
        <label>
          Escenario
          <select
            value={scenarioId}
            disabled={busy || !!upload}
            onChange={(e) => {
              setScenarioId(e.target.value);
              setResultId('');
              setSelected('');
            }}
          >
            {state.scenarios
              .filter((s) => s.enabled)
              .map((s) => (
                <option value={s.id} key={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Perfil de análisis
          <select
            value={mode}
            disabled={busy}
            onChange={(e) => setMode(e.target.value as AnalysisMode)}
          >
            {Object.entries(modeLabels).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button
          className="button upload-button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={17} />
          Cargar imagen
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png"
          className="sr-only"
          aria-label="Cargar archivo JPG o PNG"
          onChange={(e) => {
            void load(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <button
          className="button primary"
          disabled={
            busy ||
            !session ||
            !canAnalyze(session.role) ||
            (!upload && !state.scenarios.some((s) => s.id === scenarioId && s.enabled))
          }
          onClick={() => void execute()}
        >
          <Play size={16} />
          {busy ? 'Procesando…' : upload ? 'Validar imagen' : 'Analizar escenario'}
        </button>
      </div>
      {session && !canAnalyze(session.role) && (
        <div className="inline-info">
          <Info size={16} />
          Tu perfil Auditor permite consultar resultados e historial. Cambia de perfil para ejecutar
          análisis.
        </div>
      )}
      {upload && (
        <div className="inline-info">
          <Info size={16} />
          <span>
            <b>{upload.name}</b> · Se validará y registrará sin detecciones. No se envía a ningún
            servidor.
          </span>
          <button
            disabled={busy}
            className="text-button"
            onClick={() => {
              uploadToken.current++;
              setUpload(null);
              setResultId('');
            }}
          >
            Usar escenario <X size={14} />
          </button>
        </div>
      )}
      {busy && (
        <div className="progress-area" role="status">
          <div>
            <Sparkles size={16} />
            {progress.label}
            <strong>{progress.value}%</strong>
          </div>
          <progress max="100" value={progress.value} />
        </div>
      )}
      <div className="analysis-workspace">
        <div>
          <VisionViewer
            scenarioId={sourceScenario}
            analysis={analysis}
            threshold={threshold}
            classId={classId}
            selected={selected}
            uploadUrl={upload?.url}
            zone={zone}
          />
          <div className="analysis-note">
            <Info size={17} />
            <p>
              <strong>Una simulación transparente.</strong> Las cajas y regiones corresponden a
              plantillas de la escena ilustrada. No se está ejecutando un modelo de inteligencia
              artificial.
            </p>
          </div>
          <div className="result-stats">
            <div>
              <span>Estado</span>
              <strong>
                {analysis?.status === 'completed' ? (
                  <>
                    <CheckCircle2 size={16} />
                    Completado
                  </>
                ) : analysis?.status === 'failed' ? (
                  'Error'
                ) : busy ? (
                  'En proceso'
                ) : (
                  'Preparado'
                )}
              </strong>
            </div>
            <div>
              <span>Detecciones visibles</span>
              <strong>{analysis ? detections.length : '—'}</strong>
            </div>
            <div>
              <span>Confianza del resultado</span>
              <strong>
                {analysis && analysis.averageConfidence > 0
                  ? percent(analysis.averageConfidence)
                  : '—'}
              </strong>
            </div>
            <div>
              <span>Duración simulada</span>
              <strong>
                {analysis && analysis.sourceKind === 'scenario'
                  ? `${(analysis.result.durationMs / 1000).toFixed(2)} s`
                  : '—'}
              </strong>
            </div>
          </div>
        </div>
        <section className="card results-panel">
          <div className="section-title">
            <div>
              <h2>Resultados del análisis</h2>
              <p className="muted mono">
                {analysis ? shortId(analysis.id) : 'Selecciona y ejecuta una escena'}
              </p>
            </div>
            <Badge tone="teal">DEMO</Badge>
          </div>
          <div className="result-tabs" role="tablist" aria-label="Tipo de resultado">
            {[
              { id: 'detections', name: 'Objetos', icon: ScanLine, count: detections.length },
              { id: 'masks', name: 'Máscaras', icon: Layers, count: masks.length },
              { id: 'patterns', name: 'Patrones', icon: Sparkles, count: patterns.length },
            ].map(({ id, name, icon: Icon, count }) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                aria-controls="result-panel"
                onClick={() => setTab(id)}
                className={tab === id ? 'active' : ''}
              >
                <Icon size={14} />
                {name}
                <span>{count}</span>
              </button>
            ))}
          </div>
          <div className="result-filters">
            <label>
              <span>
                <SlidersHorizontal size={14} />
                Confianza mínima <b>{percent(threshold)}</b>
              </span>
              <input
                type="range"
                min="0"
                max="100"
                aria-label="Confianza mínima de resultados"
                value={Math.round(threshold * 100)}
                onChange={(e) => setThreshold(Number(e.target.value) / 100)}
              />
            </label>
            {tab !== 'patterns' && (
              <select
                aria-label="Filtrar resultados por clase"
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value);
                  setSelected('');
                }}
              >
                <option value="">Todas las clases</option>
                {state.classes
                  .filter((c) => c.enabled)
                  .map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            )}
          </div>
          <div className="result-list" id="result-panel" role="tabpanel" aria-label={tab}>
            {!analysis ? (
              <Empty title="Todo listo para explorar">
                Pulsa Analizar escenario para descubrir sus resultados.
              </Empty>
            ) : analysis.error ? (
              <Empty title="No se completó el análisis">{analysis.error}</Empty>
            ) : analysis.sourceKind === 'upload' ? (
              <Empty title="Imagen validada">
                El modo DEMO no genera predicciones sobre imágenes propias. Usa un escenario para
                explorar resultados.
              </Empty>
            ) : (
              <>
                {tab === 'detections' &&
                  (detections.length ? (
                    detections.map((d) => (
                      <button
                        className={`detection-row ${selected === d.id ? 'active' : ''}`}
                        aria-pressed={selected === d.id}
                        key={d.id}
                        onClick={() => setSelected(selected === d.id ? '' : d.id)}
                      >
                        <span
                          className="class-icon"
                          style={{ color: state.classes.find((c) => c.id === d.classId)?.color }}
                        >
                          <ScanLine size={19} />
                        </span>
                        <div>
                          <strong>{d.label}</strong>
                          <small className="mono">
                            x {d.box.x.toFixed(2)} · y {d.box.y.toFixed(2)} ·{' '}
                            {d.box.width.toFixed(2)} × {d.box.height.toFixed(2)}
                          </small>
                        </div>
                        <b>{percent(d.confidence)}</b>
                      </button>
                    ))
                  ) : (
                    <Empty title="Sin objetos visibles">
                      Reduce el umbral, cambia la clase o ejecuta un perfil con detección.
                    </Empty>
                  ))}
                {tab === 'masks' &&
                  (masks.length ? (
                    masks.map((m) => (
                      <div className="mask-row" key={m.id}>
                        <Layers
                          size={21}
                          style={{ color: state.classes.find((c) => c.id === m.classId)?.color }}
                        />
                        <div>
                          <strong>{m.label}</strong>
                          <p>Área de la imagen: {(m.areaRatio * 100).toFixed(1)}%</p>
                          <small>Polígono didáctico · {percent(m.confidence)}</small>
                        </div>
                      </div>
                    ))
                  ) : (
                    <Empty title="Sin máscaras visibles">
                      Usa el perfil Combinado o Segmentación y activa Máscaras en el visor.
                    </Empty>
                  ))}
                {tab === 'patterns' &&
                  (patterns.length ? (
                    patterns.map((p) => (
                      <div className="pattern-result" key={p.id}>
                        <Badge tone="amber">Requiere interpretación</Badge>
                        <h3>{p.label}</h3>
                        <p>{p.evidence}</p>
                        <span>
                          Confianza de ejemplo <b>{percent(p.confidence)}</b>
                        </span>
                        <a className="text-button" href="#/alerts">
                          Revisar alertas relacionadas →
                        </a>
                      </div>
                    ))
                  ) : (
                    <Empty title="Sin patrones visibles">
                      Usa el perfil Combinado o Patrones y ajusta el umbral.
                    </Empty>
                  ))}
              </>
            )}
          </div>
          {analysis && (
            <div className="panel-foot">
              Los filtros no eliminan resultados del registro original.
            </div>
          )}
        </section>
      </div>
    </>
  );
}
