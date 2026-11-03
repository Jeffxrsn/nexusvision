import { useState } from 'react';
import {
  ArrowUpRight,
  ScanLine,
  Boxes,
  ShieldAlert,
  Crosshair,
  Plus,
  Clock3,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../../app/providers/AppProvider';
import { dashboard } from '../../../core/application/operations';
import { canAnalyze, severityLabels } from '../../../core/domain/model';
import {
  Badge,
  PageHeading,
  SectionTitle,
  LinkButton,
  percent,
  dateTime,
  shortId,
  Empty,
  assetUrl,
} from '../../../shared/ui';
import { scenarios } from '../../scenarios/data/scenarios';

export function DashboardPage() {
  const { state, session } = useApp();
  const [days, setDays] = useState(7);
  const stats = dashboard(state, days);
  const max = Math.ceil(Math.max(4, ...stats.series.map((d) => d.value)) / 4) * 4;
  const points = stats.series
    .map((d, i) => `${30 + (i * 640) / (days - 1)},${152 - (d.value / max) * 120}`)
    .join(' ');
  const metrics = [
    {
      label: 'Análisis ejecutados',
      value: stats.analyses.length,
      detail: 'Completados en el período',
      icon: ScanLine,
      color: 'teal',
    },
    {
      label: 'Objetos detectados',
      value: stats.detections.length,
      detail: 'Detecciones brutas de ejemplo',
      icon: Boxes,
      color: 'blue',
    },
    {
      label: 'Alertas por revisar',
      value: stats.activeAlerts.length,
      detail: 'Nuevas y revisadas',
      icon: ShieldAlert,
      color: 'amber',
    },
    {
      label: 'Confianza media',
      value: stats.detections.length ? percent(stats.meanConfidence) : '—',
      detail: 'Valor simulado · sin precisión real',
      icon: Crosshair,
      color: 'violet',
    },
  ];
  return (
    <>
      <PageHeading
        eyebrow="TU OPERACIÓN, EN PERSPECTIVA"
        title="Resumen general"
        description="Transforma imágenes en información que puedes interpretar."
      >
        <select
          aria-label="Período del dashboard"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          <option value={7}>Últimos 7 días</option>
          <option value={30}>Últimos 30 días</option>
        </select>
        {session && canAnalyze(session.role) && (
          <a className="button primary" href="#/analysis">
            <Plus size={17} />
            Nuevo análisis
          </a>
        )}
      </PageHeading>
      <div className="demo-strip">
        <span className="demo-pill">DEMO</span>
        <span>
          Explora sin límites. Estos resultados son una simulación para aprender y demostrar.
        </span>
        <a href="#/guide">
          Cómo funciona <ArrowUpRight size={14} />
        </a>
      </div>
      <div className="metric-grid">
        {metrics.map(({ label, value, detail, icon: Icon, color }) => (
          <div className="metric-card" key={label}>
            <div className="metric-top">
              <span>{label}</span>
              <span className={`metric-icon ${color}`}>
                <Icon size={19} />
              </span>
            </div>
            <strong>{value}</strong>
            <small>{detail}</small>
          </div>
        ))}
      </div>
      <div className="dashboard-charts">
        <section className="card activity-chart">
          <SectionTitle title="Actividad de análisis" description="Análisis completados por día">
            <Badge tone="teal">
              <span className="status-dot" />
              Actividad local
            </Badge>
          </SectionTitle>
          <div className="chart-key">
            <span className="dot teal-bg" />
            Análisis de demostración{' '}
            <span className="chart-total">
              {stats.analyses.length} <small>en total</small>
            </span>
          </div>
          <svg
            viewBox="0 0 700 190"
            className="line-chart"
            role="img"
            aria-label={`Actividad de los últimos ${days} días: ${stats.series.map((p) => `${p.label}: ${p.value}`).join('; ')}`}
          >
            <defs>
              <linearGradient id="chart-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#20b8a4" stopOpacity=".22" />
                <stop offset="100%" stopColor="#20b8a4" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 1, 2, 3, 4].map((i) => (
              <g key={i}>
                <line
                  x1="30"
                  x2="670"
                  y1={32 + i * 30}
                  y2={32 + i * 30}
                  stroke="#edf1f4"
                  strokeDasharray="4 5"
                />
                <text x="5" y={36 + i * 30} fill="#8b99a6" fontSize="11">
                  {Math.round(max - (i * max) / 4)}
                </text>
              </g>
            ))}
            <polygon points={`30,152 ${points} 670,152`} fill="url(#chart-area)" />
            <polyline
              points={points}
              fill="none"
              stroke="#13a894"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {stats.series.map((d, i) => (
              <g key={d.date}>
                {(days === 7 || i % 5 === 0 || i === days - 1) && (
                  <text
                    x={30 + (i * 640) / (days - 1)}
                    y="181"
                    textAnchor="middle"
                    fill="#8b99a6"
                    fontSize="11"
                  >
                    {d.label}
                  </text>
                )}
                {days === 7 && (
                  <circle
                    cx={30 + (i * 640) / (days - 1)}
                    cy={152 - (d.value / max) * 120}
                    r="4"
                    fill="white"
                    stroke="#13a894"
                    strokeWidth="2"
                  />
                )}
              </g>
            ))}
          </svg>
          <div className="chart-foot">
            <Clock3 size={14} />
            <span>
              Duración media de ejemplo:{' '}
              <b>{stats.meanDuration ? `${(stats.meanDuration / 1000).toFixed(2)} s` : '—'}</b>
            </span>
          </div>
        </section>
        <section className="card distribution">
          <SectionTitle
            title="Objetos por clase"
            description="Distribución de detecciones brutas"
          />
          {stats.distribution.length ? (
            stats.distribution.slice(0, 6).map((c) => (
              <div className="distribution-row" key={c.id}>
                <div>
                  <span>
                    <i className="dot" style={{ background: c.color }} />
                    {c.name}
                  </span>
                  <b>{c.count}</b>
                </div>
                <div className="bar-track">
                  <span
                    style={{
                      width: `${(c.count / stats.detections.length) * 100}%`,
                      background: c.color,
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <Empty title="Sin detecciones">Ejecuta tu primer escenario.</Empty>
          )}
        </section>
      </div>
      <section className="scenarios-section">
        <SectionTitle
          title="Una mirada para cada industria"
          description="Elige un escenario y descubre el flujo de análisis."
        >
          <LinkButton href="#/scenarios">Ver escenarios</LinkButton>
        </SectionTitle>
        <div className="scenario-quick-grid">
          {scenarios
            .filter((s) => state.scenarios.find((c) => c.id === s.id)?.enabled)
            .map((s) => (
              <a className="scenario-quick" href={`#/analysis?scenario=${s.id}`} key={s.id}>
                <img src={assetUrl(s.asset)} alt="" />
                <div>
                  <small>{s.sector}</small>
                  <h3>{state.scenarios.find((c) => c.id === s.id)?.name ?? s.name}</h3>
                  <span>
                    Explorar escenario <ArrowRight size={14} />
                  </span>
                </div>
              </a>
            ))}
        </div>
      </section>
      <div className="dashboard-bottom">
        <section className="card">
          <SectionTitle title="Análisis recientes">
            <LinkButton href="#/history">Ver historial</LinkButton>
          </SectionTitle>
          {stats.analyses.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Análisis</th>
                    <th>Escenario</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>
                      <span className="sr-only">Detalle</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.analyses.slice(0, 5).map((a) => (
                    <tr key={a.id}>
                      <td>
                        <strong className="mono">{shortId(a.id)}</strong>
                        {a.seeded && <small className="subtext">Registro semilla</small>}
                      </td>
                      <td>{a.sourceName}</td>
                      <td>
                        <Badge tone="teal">Completado</Badge>
                      </td>
                      <td className="muted">{dateTime(a.createdAt)}</td>
                      <td>
                        <a
                          className="icon-button"
                          aria-label={`Ver ${shortId(a.id)}`}
                          href={`#/analysis?id=${a.id}`}
                        >
                          <ArrowUpRight size={16} />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty title="Sin análisis en este período">
              Selecciona otro rango o ejecuta un escenario.
            </Empty>
          )}
        </section>
        <section className="card">
          <SectionTitle title="Alertas recientes">
            <LinkButton href="#/alerts">Ver todas</LinkButton>
          </SectionTitle>
          {stats.activeAlerts.length ? (
            stats.activeAlerts.slice(0, 3).map((a) => (
              <a className="alert-summary" href={`#/alerts?alert=${a.id}`} key={a.id}>
                <span className={`alert-summary-icon ${a.severity}`}>
                  <ShieldAlert size={18} />
                </span>
                <div>
                  <strong>{a.message}</strong>
                  <p>{dateTime(a.createdAt)} · Revisión humana</p>
                  <Badge tone={a.severity === 'high' ? 'red' : 'amber'}>
                    {severityLabels[a.severity]}
                  </Badge>
                </div>
                <ArrowUpRight size={15} />
              </a>
            ))
          ) : (
            <Empty title="Todo revisado">No hay alertas abiertas en el período.</Empty>
          )}
        </section>
      </div>
    </>
  );
}
