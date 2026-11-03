import { useEffect, useState } from 'react';
import { ShieldAlert, CheckCheck, Search, ArrowUpRight, UserCheck } from 'lucide-react';
import { useApp } from '../../../app/providers/AppProvider';
import { canReview, severityLabels, statusLabels } from '../../../core/domain/model';
import { reviewAlert } from '../../../core/application/operations';
import { Badge, Empty, PageHeading, dateTime, percent, shortId } from '../../../shared/ui';

export function AlertsPage({ query }: { query: URLSearchParams }) {
  const { state, session, mutate, notify, busy } = useApp();
  const [status, setStatus] = useState('all'),
    [severity, setSeverity] = useState('all'),
    [search, setSearch] = useState(''),
    [selected, setSelected] = useState(query.get('alert') ?? ''),
    [note, setNote] = useState('');
  const alerts = state.alerts.filter(
    (a) =>
      (status === 'all' || a.status === status) &&
      (severity === 'all' || a.severity === severity) &&
      `${a.message} ${a.analysisId}`.toLowerCase().includes(search.toLowerCase()),
  );
  const alert = alerts.find((a) => a.id === selected) ?? alerts[0];
  useEffect(() => setNote(alert?.note ?? ''), [alert?.id, alert?.note]);
  const submit = () => {
    if (!alert || !session) return;
    try {
      mutate((s) =>
        reviewAlert(s, alert.id, alert.status === 'new' ? 'reviewed' : 'closed', note, session),
      );
      notify('Alerta actualizada y acción registrada.');
    } catch (e) {
      notify((e as Error).message, 'error');
    }
  };
  return (
    <>
      <PageHeading
        eyebrow="OBSERVAR, INTERPRETAR, ACTUAR"
        title="Centro de alertas"
        description="Cada hallazgo necesita contexto. Revisa la evidencia y registra tu observación."
      >
        <Badge tone="amber">
          <ShieldAlert size={14} />
          {state.alerts.filter((a) => a.status === 'new').length} nuevas
        </Badge>
      </PageHeading>
      <div className="filter-bar card">
        <label className="search-field">
          <Search size={17} />
          <input
            aria-label="Buscar alertas"
            placeholder="Buscar alerta o análisis…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          aria-label="Estado de alerta"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">Todos los estados</option>
          <option value="new">Nuevas</option>
          <option value="reviewed">Revisadas</option>
          <option value="closed">Cerradas</option>
        </select>
        <select
          aria-label="Severidad de alerta"
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
        >
          <option value="all">Todas las severidades</option>
          {Object.entries(severityLabels).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <span className="muted">{alerts.length} resultados</span>
      </div>
      <div className="alerts-layout">
        <section className="card alert-list">
          {alerts.length ? (
            alerts.map((a) => (
              <button
                key={a.id}
                className={`alert-list-row ${alert?.id === a.id ? 'active' : ''}`}
                aria-pressed={alert?.id === a.id}
                onClick={() => setSelected(a.id)}
              >
                <span className={`alert-summary-icon ${a.severity}`}>
                  <ShieldAlert size={20} />
                </span>
                <div>
                  <div className="alert-row-title">
                    <strong>{a.message}</strong>
                    <Badge tone={a.severity === 'high' ? 'red' : 'amber'}>
                      {severityLabels[a.severity]}
                    </Badge>
                  </div>
                  <p>
                    {shortId(a.analysisId)} · {dateTime(a.createdAt)}
                  </p>
                  <Badge
                    tone={
                      a.status === 'closed' ? 'teal' : a.status === 'reviewed' ? 'blue' : 'neutral'
                    }
                  >
                    {statusLabels[a.status]}
                  </Badge>
                </div>
                <ArrowUpRight size={16} />
              </button>
            ))
          ) : (
            <Empty title="No hay alertas con estos filtros">
              Prueba otro estado o ejecuta un análisis combinado.
            </Empty>
          )}
        </section>
        <section className="card alert-detail">
          {alert ? (
            <>
              <div className="section-title">
                <h2>Detalle de la alerta</h2>
                <Badge tone="teal">DEMO</Badge>
              </div>
              <div className="detail-emblem">
                <ShieldAlert size={26} />
              </div>
              <h3>{alert.message}</h3>
              <p className="muted">Un hallazgo simulado, pendiente de interpretación humana.</p>
              <dl className="detail-grid">
                <div>
                  <dt>Severidad</dt>
                  <dd>{severityLabels[alert.severity]}</dd>
                </div>
                <div>
                  <dt>Estado</dt>
                  <dd>{statusLabels[alert.status]}</dd>
                </div>
                <div>
                  <dt>Confianza</dt>
                  <dd>{percent(alert.confidence)}</dd>
                </div>
                <div>
                  <dt>Regla</dt>
                  <dd>{alert.ruleId}</dd>
                </div>
              </dl>
              <div className="evidence">
                <strong>Evidencia de demostración</strong>
                <p>{alert.evidence}</p>
                <a className="text-button" href={`#/analysis?id=${alert.analysisId}`}>
                  Ver análisis original <ArrowUpRight size={14} />
                </a>
              </div>
              {alert.reviewedBy && (
                <p className="reviewer">
                  <UserCheck size={16} /> {alert.reviewedBy} · {dateTime(alert.updatedAt)}
                </p>
              )}
              {session && canReview(session.role) && alert.status !== 'closed' ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submit();
                  }}
                >
                  <label>
                    Observación de revisión
                    <textarea
                      required
                      maxLength={500}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Describe lo observado y la acción de demostración…"
                      rows={4}
                    />
                  </label>
                  <button
                    className="button primary full-width"
                    disabled={busy || !note.trim()}
                    type="submit"
                  >
                    <CheckCheck size={16} />
                    {alert.status === 'new' ? 'Marcar como revisada' : 'Cerrar alerta'}
                  </button>
                </form>
              ) : (
                <div className="inline-info">
                  <p>
                    {alert.note ||
                      'Los perfiles Administrador y Supervisor pueden revisar esta alerta.'}
                  </p>
                </div>
              )}
            </>
          ) : (
            <Empty title="Selecciona una alerta">
              Su evidencia y trazabilidad aparecerán aquí.
            </Empty>
          )}
        </section>
      </div>
    </>
  );
}
