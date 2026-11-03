import { useState } from 'react';
import { ArrowRight, Settings2, Save, Layers, ScanLine } from 'lucide-react';
import { useApp } from '../../../app/providers/AppProvider';
import { canConfigure } from '../../../core/domain/model';
import { updateConfiguration } from '../../../core/application/operations';
import { Badge, PageHeading, assetUrl } from '../../../shared/ui';
import { scenarios } from '../data/scenarios';

export function ScenariosPage() {
  const { state, session, mutate, notify, busy } = useApp();
  const [editing, setEditing] = useState(''),
    [name, setName] = useState(''),
    [description, setDescription] = useState(''),
    [enabled, setEnabled] = useState(true);
  const save = () => {
    if (!session) return;
    try {
      mutate((s) =>
        updateConfiguration(
          s,
          {
            threshold: s.threshold,
            classes: s.classes,
            scenarios: s.scenarios.map((c) =>
              c.id === editing
                ? { ...c, name: name.trim(), description: description.trim(), enabled }
                : c,
            ),
          },
          session,
        ),
      );
      setEditing('');
      notify('Escenario actualizado.');
    } catch {
      notify('Revisa el nombre y la descripción del escenario.', 'error');
    }
  };
  return (
    <>
      <PageHeading
        eyebrow="CUATRO CONTEXTOS, MUCHAS POSIBILIDADES"
        title="Escenarios de demostración"
        description="Escenas ilustradas y resultados calibrados para explorar cada capacidad."
      />
      <div className="scenario-gallery">
        {scenarios.map((s) => {
          const config = state.scenarios.find((c) => c.id === s.id) ?? s;
          return (
            <article
              key={s.id}
              className={`card scenario-card ${!config.enabled ? 'disabled-scenario' : ''}`}
            >
              <div className="scenario-image">
                <img src={assetUrl(s.asset)} alt={`Ilustración de ${s.name}`} />
                <Badge tone="dark">{s.tag}</Badge>
              </div>
              <div className="scenario-content">
                <div className="scenario-title">
                  <small className="eyebrow">{s.sector}</small>
                  <Badge tone={config.enabled ? 'teal' : 'neutral'}>
                    {config.enabled ? 'Disponible' : 'Deshabilitado'}
                  </Badge>
                </div>
                <h2>{config.name}</h2>
                <p className="muted">{config.description}</p>
                <div className="scenario-counts">
                  <span>
                    <ScanLine size={15} />
                    {s.result.detections.length} objetos
                  </span>
                  <span>
                    <Layers size={15} />
                    {s.result.masks.length} regiones
                  </span>
                </div>
                {editing === s.id ? (
                  <form
                    className="scenario-edit"
                    onSubmit={(e) => {
                      e.preventDefault();
                      save();
                    }}
                  >
                    <label>
                      Nombre
                      <input
                        required
                        maxLength={80}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </label>
                    <label>
                      Descripción
                      <textarea
                        maxLength={240}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </label>
                    <label className="check-label">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setEnabled(e.target.checked)}
                      />
                      Escenario habilitado
                    </label>
                    <div className="button-row">
                      <button disabled={busy} className="button primary" type="submit">
                        <Save size={14} />
                        Guardar
                      </button>
                      <button className="button" type="button" onClick={() => setEditing('')}>
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="scenario-actions">
                    {config.enabled ? (
                      <a className="button primary" href={`#/analysis?scenario=${s.id}`}>
                        Explorar escenario <ArrowRight size={15} />
                      </a>
                    ) : (
                      <span className="muted">Habilítalo para analizarlo.</span>
                    )}
                    {session && canConfigure(session.role) && (
                      <button
                        className="icon-button"
                        aria-label={`Configurar ${s.name}`}
                        onClick={() => {
                          setEditing(s.id);
                          setName(config.name);
                          setDescription(config.description);
                          setEnabled(config.enabled);
                        }}
                      >
                        <Settings2 size={18} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <div className="inline-info">
        Las escenas y sus coordenadas forman un conjunto calibrado. Añadir nuevas plantillas
        requiere definir su imagen, objetos, máscaras y pruebas en el código.
      </div>
    </>
  );
}
