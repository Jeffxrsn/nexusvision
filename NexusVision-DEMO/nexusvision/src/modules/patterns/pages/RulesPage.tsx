import { useState } from 'react';
import { Save, Shield, MapPin, ScanLine, Users } from 'lucide-react';
import type { Rule } from '../../../core/domain/model';
import { severityLabels } from '../../../core/domain/model';
import { updateRule } from '../../../core/application/operations';
import { useApp } from '../../../app/providers/AppProvider';
import { Badge, PageHeading, percent } from '../../../shared/ui';

function RuleEditor({ rule }: { rule: Rule }) {
  const { session, mutate, notify, busy } = useApp();
  const [draft, setDraft] = useState(rule);
  const Icon =
    rule.condition === 'missing_ppe'
      ? Shield
      : rule.condition === 'restricted_zone'
        ? MapPin
        : rule.condition === 'congestion'
          ? Users
          : ScanLine;
  const save = () => {
    if (!session) return;
    try {
      mutate((s) => updateRule(s, draft, session));
      notify('Regla guardada. Se aplicará en los próximos análisis.');
    } catch {
      notify(
        'Revisa los valores: la zona debe estar dentro de 0–1 y el nombre no puede quedar vacío.',
        'error',
      );
    }
  };
  return (
    <form
      className="card rule-card"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="rule-heading">
        <span className="metric-icon teal">
          <Icon size={22} />
        </span>
        <div>
          <h2>{rule.name}</h2>
          <small className="muted">{rule.condition}</small>
        </div>
        <label className="switch">
          <input
            type="checkbox"
            aria-label={`Habilitar ${rule.name}`}
            checked={draft.enabled}
            onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
          />
          <span />
        </label>
      </div>
      <label>
        Nombre de la regla
        <input
          required
          maxLength={80}
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
      </label>
      <div className="form-two">
        <label>
          Severidad
          <select
            value={draft.severity}
            onChange={(e) => setDraft({ ...draft, severity: e.target.value as Rule['severity'] })}
          >
            {Object.entries(severityLabels).map(([k, v]) => (
              <option value={k} key={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label>
          Confianza mínima: {percent(draft.threshold)}
          <input
            aria-label={`Confianza de ${rule.name}`}
            type="range"
            min="0"
            max="100"
            value={Math.round(draft.threshold * 100)}
            onChange={(e) => setDraft({ ...draft, threshold: Number(e.target.value) / 100 })}
          />
        </label>
      </div>
      {draft.condition === 'congestion' && (
        <label>
          Personas visibles para activar la alerta
          <input
            type="number"
            min="1"
            max="100"
            required
            value={draft.minCount}
            onChange={(e) => setDraft({ ...draft, minCount: Number(e.target.value) })}
          />
        </label>
      )}
      {draft.condition === 'restricted_zone' && (
        <fieldset>
          <legend>Zona normalizada del almacén</legend>
          <div className="zone-fields">
            {(['x', 'y', 'width', 'height'] as const).map((key) => (
              <label key={key}>
                {{ x: 'X', y: 'Y', width: 'Ancho', height: 'Alto' }[key]}
                <input
                  type="number"
                  step="0.01"
                  min={key === 'x' || key === 'y' ? 0 : 0.01}
                  max="1"
                  required
                  value={draft.zone[key]}
                  onChange={(e) =>
                    setDraft({ ...draft, zone: { ...draft.zone, [key]: Number(e.target.value) } })
                  }
                />
              </label>
            ))}
          </div>
          <small className="muted">
            Se activa si el centro del montacargas entra en esta región.
          </small>
        </fieldset>
      )}
      <div className="rule-footer">
        <Badge tone={draft.enabled ? 'teal' : 'neutral'}>
          {draft.enabled ? 'Activa' : 'Inactiva'}
        </Badge>
        <button disabled={busy} type="submit" className="button">
          <Save size={15} />
          Guardar regla
        </button>
      </div>
    </form>
  );
}
export function RulesPage() {
  const { state } = useApp();
  return (
    <>
      <PageHeading
        eyebrow="CONVIERTE HALLAZGOS EN OBSERVACIONES"
        title="Reglas y patrones"
        description="Configura qué condiciones generan alertas en los próximos análisis."
      />
      <div className="inline-info">
        Las reglas trabajan sobre resultados de demostración. Los cambios no alteran las alertas
        históricas.
      </div>
      <div className="rules-grid">
        {state.rules.map((r) => (
          <RuleEditor key={r.id} rule={r} />
        ))}
      </div>
    </>
  );
}
