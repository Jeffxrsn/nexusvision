import { useState } from 'react';
import { ArrowUpRight, Download, Search, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { useApp } from '../../../app/providers/AppProvider';
import { modeLabels, statusLabels } from '../../../core/domain/model';
import { Badge, Empty, PageHeading, dateTime, shortId } from '../../../shared/ui';

export function HistoryPage({ query }: { query: URLSearchParams }) {
  const { state, exportAnalyses } = useApp();
  const [search, setSearch] = useState(query.get('q') ?? ''),
    [scenario, setScenario] = useState(''),
    [status, setStatus] = useState(''),
    [from, setFrom] = useState(''),
    [to, setTo] = useState(''),
    [page, setPage] = useState(1);
  const filtered = state.analyses.filter(
    (a) =>
      (!scenario || a.scenarioId === scenario) &&
      (!status || a.status === status) &&
      `${a.id} ${a.sourceName} ${a.createdBy}`.toLowerCase().includes(search.toLowerCase()) &&
      (!from || new Date(a.createdAt) >= new Date(`${from}T00:00:00`)) &&
      (!to || new Date(a.createdAt) <= new Date(`${to}T23:59:59.999`)),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 10)),
    current = Math.min(page, pages);
  const invalidDates = !!(from && to && from > to);
  return (
    <>
      <PageHeading
        eyebrow="CADA ANÁLISIS CUENTA UNA HISTORIA"
        title="Historial de análisis"
        description="Consulta, filtra y exporta los resultados guardados en este navegador."
      >
        <button
          className="button primary"
          disabled={!filtered.length || invalidDates}
          onClick={() => exportAnalyses(filtered)}
        >
          <Download size={17} />
          Exportar CSV ({filtered.length})
        </button>
      </PageHeading>
      <section className="card history-card">
        <div className="filter-bar">
          <label className="search-field">
            <Search size={17} />
            <input
              aria-label="Buscar en historial"
              placeholder="Buscar por ID, origen o usuario…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <select
            aria-label="Escenario del historial"
            value={scenario}
            onChange={(e) => {
              setScenario(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos los escenarios</option>
            {state.scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Estado del análisis"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos los estados</option>
            <option value="completed">Completado</option>
            <option value="processing">En proceso</option>
            <option value="failed">Error</option>
          </select>
        </div>
        <div className="date-filter-row">
          <label>
            Desde
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <label>
            Hasta
            <input
              type="date"
              min={from || undefined}
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <button
            className="text-button"
            onClick={() => {
              setSearch('');
              setScenario('');
              setStatus('');
              setFrom('');
              setTo('');
              setPage(1);
            }}
          >
            <RotateCcw size={14} />
            Limpiar filtros
          </button>
          <span className="muted">{filtered.length} análisis encontrados</span>
        </div>
        {invalidDates ? (
          <Empty title="Revisa las fechas">
            La fecha de inicio debe ser anterior o igual a la fecha final.
          </Empty>
        ) : filtered.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>ID / fecha</th>
                  <th>Origen</th>
                  <th>Perfil</th>
                  <th>Objetos</th>
                  <th>Alertas abiertas</th>
                  <th>Estado</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice((current - 1) * 10, current * 10).map((a) => (
                  <tr key={a.id}>
                    <td>
                      <strong className="mono">{shortId(a.id)}</strong>
                      <small className="subtext">{dateTime(a.createdAt)}</small>
                    </td>
                    <td>
                      <strong>{a.sourceName}</strong>
                      <small className="subtext">
                        {a.seeded ? 'Datos semilla · ' : ''}
                        {a.createdBy}
                      </small>
                    </td>
                    <td>{modeLabels[a.mode]}</td>
                    <td>{a.result.detections.length}</td>
                    <td>
                      {
                        state.alerts.filter((x) => x.analysisId === a.id && x.status !== 'closed')
                          .length
                      }
                    </td>
                    <td>
                      <Badge
                        tone={
                          a.status === 'completed'
                            ? 'teal'
                            : a.status === 'failed'
                              ? 'red'
                              : 'amber'
                        }
                      >
                        {statusLabels[a.status]}
                      </Badge>
                    </td>
                    <td>
                      <a
                        className="icon-button"
                        aria-label={`Abrir análisis ${shortId(a.id)}`}
                        href={`#/analysis?id=${a.id}`}
                      >
                        <ArrowUpRight size={17} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No encontramos análisis">
            Cambia los filtros o crea un análisis en el Centro de análisis.
          </Empty>
        )}
        <div className="pagination">
          <span>
            Página {current} de {pages} · Todos los registros están en modo DEMO
          </span>
          <div>
            <button
              className="icon-button"
              aria-label="Página anterior"
              disabled={current === 1}
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className="icon-button"
              aria-label="Página siguiente"
              disabled={current === pages}
              onClick={() => setPage(current + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
