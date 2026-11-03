import { useState } from 'react';
import { Save, RotateCcw, Trash2, HardDrive, ShieldCheck } from 'lucide-react';
import { useApp } from '../../../app/providers/AppProvider';
import {
  audit,
  emptyState,
  seedState,
  updateConfiguration,
} from '../../../core/application/operations';
import { roles } from '../../../core/domain/model';
import { Badge, PageHeading, SectionTitle, dateTime, percent } from '../../../shared/ui';

export function SettingsPage() {
  const { state, session, mutate, notify, busy } = useApp();
  const [threshold, setThreshold] = useState(state.threshold),
    [classes, setClasses] = useState(state.classes),
    [confirm, setConfirm] = useState<'clear' | 'seed' | null>(null);
  const save = () => {
    if (!session) return;
    try {
      mutate((s) =>
        updateConfiguration(s, { threshold, classes, scenarios: s.scenarios }, session),
      );
      notify('Configuración guardada.');
    } catch {
      notify('No se guardó la configuración. Revisa los campos y el almacenamiento.', 'error');
    }
  };
  const reset = () => {
    if (!session) return;
    try {
      mutate(() =>
        audit(
          confirm === 'seed' ? seedState() : emptyState(),
          session,
          confirm === 'seed' ? 'Restablecimiento DEMO' : 'Borrado de datos locales',
          'Este navegador',
        ),
      );
      setThreshold(0.75);
      setClasses(emptyState().classes);
      setConfirm(null);
      notify('Datos locales actualizados.');
    } catch (e) {
      notify((e as Error).message, 'error');
    }
  };
  return (
    <>
      <PageHeading
        eyebrow="UN ESPACIO A TU MEDIDA"
        title="Configuración"
        description="Gestiona las preferencias, clases y datos de tu entorno de demostración."
      />
      <div className="settings-grid">
        <section className="card settings-section">
          <SectionTitle
            title="Preferencias de análisis"
            description="Se aplican a los próximos análisis."
          />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <label>
              Umbral general de confianza <b>{percent(threshold)}</b>
              <input
                aria-label="Umbral general de confianza"
                type="range"
                min="0"
                max="100"
                value={Math.round(threshold * 100)}
                onChange={(e) => setThreshold(Number(e.target.value) / 100)}
              />
            </label>
            <p className="muted">
              Las detecciones inferiores se conservan en el registro bruto, pero se ocultan por
              defecto y no activan reglas.
            </p>
            <SectionTitle
              title="Clases visuales"
              description="Color y visibilidad de los resultados."
            />
            <div className="class-config">
              {classes.map((c) => (
                <div key={c.id}>
                  <input
                    type="color"
                    aria-label={`Color de ${c.name}`}
                    value={c.color}
                    onChange={(e) =>
                      setClasses(
                        classes.map((x) => (x.id === c.id ? { ...x, color: e.target.value } : x)),
                      )
                    }
                  />
                  <span>{c.name}</span>
                  <label className="switch">
                    <input
                      type="checkbox"
                      aria-label={`Mostrar clase ${c.name}`}
                      checked={c.enabled}
                      onChange={(e) =>
                        setClasses(
                          classes.map((x) =>
                            x.id === c.id ? { ...x, enabled: e.target.checked } : x,
                          ),
                        )
                      }
                    />
                    <span />
                  </label>
                </div>
              ))}
            </div>
            <button className="button primary" disabled={busy} type="submit">
              <Save size={16} />
              Guardar configuración
            </button>
          </form>
        </section>
        <div>
          <section className="card settings-section">
            <SectionTitle title="Perfiles de demostración">
              <ShieldCheck size={22} />
            </SectionTitle>
            <p className="muted">
              El acceso es simulado. Elige un perfil al iniciar sesión; no se usan contraseñas ni
              existe autenticación de servidor.
            </p>
            <div className="role-matrix">
              {Object.entries(roles).map(([id, name]) => (
                <div key={id}>
                  <strong>{name}</strong>
                  <span>
                    {id === 'admin'
                      ? 'Análisis, revisión y configuración'
                      : id === 'operator'
                        ? 'Análisis y consulta'
                        : id === 'supervisor'
                          ? 'Análisis, consulta y revisión'
                          : 'Consulta y exportación'}
                  </span>
                </div>
              ))}
            </div>
          </section>
          <section className="card settings-section">
            <SectionTitle title="Datos de este navegador">
              <HardDrive size={22} />
            </SectionTitle>
            <p className="muted">
              {state.analyses.length} análisis · {state.alerts.length} alertas. Las imágenes propias
              no se conservan. La demo no sincroniza datos entre equipos.
            </p>
            <div className="button-row">
              <button className="button" disabled={busy} onClick={() => setConfirm('seed')}>
                <RotateCcw size={15} />
                Restablecer demo
              </button>
              <button className="button danger" disabled={busy} onClick={() => setConfirm('clear')}>
                <Trash2 size={15} />
                Vaciar datos
              </button>
            </div>
            {confirm && (
              <div className="confirm-box" role="alert">
                <strong>{confirm === 'seed' ? 'Restablecer ejemplos' : 'Vaciar el entorno'}</strong>
                <p>
                  Se eliminarán los análisis, alertas, eventos y preferencias locales actuales.
                  Exporta el historial si quieres conservarlo.
                </p>
                <div className="button-row">
                  <button disabled={busy} className="button danger" onClick={reset}>
                    Confirmar {confirm === 'seed' ? 'restablecimiento' : 'borrado'}
                  </button>
                  <button className="button" onClick={() => setConfirm(null)}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
      <section className="card audit-card">
        <SectionTitle
          title="Registro de eventos"
          description="Últimas acciones locales. Registro didáctico, modificable desde el navegador."
        >
          <Badge>{state.events.length} eventos</Badge>
        </SectionTitle>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Actor</th>
                <th>Acción</th>
                <th>Referencia</th>
              </tr>
            </thead>
            <tbody>
              {state.events.slice(0, 30).map((e) => (
                <tr key={e.id}>
                  <td>{dateTime(e.at)}</td>
                  <td>{e.actor}</td>
                  <td>{e.action}</td>
                  <td className="mono">{e.target.slice(0, 80)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!state.events.length && (
            <p className="empty-inline">
              Aún no hay acciones registradas. Ejecuta un análisis para comenzar.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
