import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  roleSchema,
  type Analysis,
  type AnalysisMode,
  type AppState,
  type Session,
} from '../../core/domain/model';
import {
  audit,
  completeAnalysis,
  emptyState,
  seedState,
  startAnalysis,
} from '../../core/application/operations';
import { LocalAnalysisRepository } from '../../infrastructure/persistence/LocalAnalysisRepository';
import { DemoVisionAdapter } from '../../infrastructure/vision/DemoVisionAdapter';
import { analysisCsv, downloadCsv } from '../../infrastructure/export/csv';

type Notice = { text: string; tone: 'success' | 'error' | 'info' };
interface Store {
  state: AppState;
  session: Session | null;
  login: (s: Session) => void;
  logout: () => void;
  mutate: (fn: (s: AppState) => AppState) => void;
  notice: Notice | null;
  notify: (text: string, tone?: Notice['tone']) => void;
  dismiss: () => void;
  storageError: string;
  busy: boolean;
  progress: { value: number; label: string };
  run: (input: {
    scenarioId: string | null;
    sourceKind: 'scenario' | 'upload';
    sourceName: string;
    mode: AnalysisMode;
  }) => Promise<string | null>;
  exportAnalyses: (rows: Analysis[]) => void;
}
const Context = createContext<Store | null>(null);
function storedSession(): Session | null {
  try {
    const raw = JSON.parse(sessionStorage.getItem('nexusvision.session') ?? 'null');
    return raw && typeof raw.name === 'string' && roleSchema.safeParse(raw.role).success
      ? raw
      : null;
  } catch {
    return null;
  }
}
function initialData(): {
  state: AppState;
  error: string;
  repository: LocalAnalysisRepository | null;
} {
  let repository: LocalAnalysisRepository | null = null;
  try {
    repository = new LocalAnalysisRepository(localStorage);
    return { state: repository.load() ?? seedState(), error: '', repository };
  } catch (e) {
    return { state: emptyState(), error: (e as Error).message, repository };
  }
}
export function AppProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(initialData);
  const [state, setState] = useState(initial.state),
    current = useRef(state);
  const [session, setSession] = useState<Session | null>(storedSession);
  const [notice, setNotice] = useState<Notice | null>(null),
    [storageError, setStorageError] = useState(initial.error);
  const [busy, setBusy] = useState(false),
    running = useRef(false);
  const [progress, setProgress] = useState({ value: 0, label: '' });
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 7000);
    return () => clearTimeout(timer);
  }, [notice]);
  const notify = (text: string, tone: Notice['tone'] = 'success') => setNotice({ text, tone });
  const mutate = (fn: (s: AppState) => AppState) => {
    const next = fn(current.current);
    try {
      if (!initial.repository)
        throw new Error('El navegador bloquea el almacenamiento local. Habilítalo para continuar.');
      initial.repository.save(next);
    } catch (e) {
      setStorageError((e as Error).message);
      throw e;
    }
    current.current = next;
    setState(next);
    setStorageError('');
  };
  const login = (value: Session) => {
    const clean = {
      name: value.name.trim().slice(0, 60) || 'Usuario DEMO',
      role: roleSchema.parse(value.role),
    };
    try {
      sessionStorage.setItem('nexusvision.session', JSON.stringify(clean));
    } catch {
      /* Session can remain in memory. */
    }
    setSession(clean);
  };
  const logout = () => {
    if (running.current) return;
    try {
      sessionStorage.removeItem('nexusvision.session');
    } catch {
      /* No persisted session. */
    }
    setSession(null);
  };
  const run: Store['run'] = async (input) => {
    if (!session || running.current) return null;
    running.current = true;
    setBusy(true);
    let pending: Analysis | undefined;
    try {
      pending = startAnalysis(current.current, input, session);
      const row = pending;
      mutate((s) => ({ ...s, analyses: [row, ...s.analyses] }));
      const result = await new DemoVisionAdapter().analyze(input, (value, label) =>
        setProgress({ value, label }),
      );
      mutate((s) => completeAnalysis(s, row, result, session));
      notify(
        input.sourceKind === 'upload'
          ? 'Imagen validada y registrada. Sin inferencia en modo DEMO.'
          : 'Análisis de demostración completado.',
      );
      return row.id;
    } catch (e) {
      const message = (e as Error).message;
      if (pending) {
        const failed = pending;
        try {
          mutate((s) => ({
            ...s,
            analyses: s.analyses.map((a) =>
              a.id === failed.id ? { ...a, status: 'failed', error: message } : a,
            ),
          }));
        } catch {
          /* Persistent error is already shown. */
        }
      }
      notify(message, 'error');
      return null;
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  const exportAnalyses = (rows: Analysis[]) => {
    if (!session) return;
    try {
      mutate((s) => audit(s, session, 'Exportación CSV · DEMO', `${rows.length} análisis`));
      downloadCsv(analysisCsv(rows));
      notify('Reporte CSV exportado.');
    } catch (e) {
      notify((e as Error).message, 'error');
    }
  };
  return (
    <Context.Provider
      value={{
        state,
        session,
        login,
        logout,
        mutate,
        notice,
        notify,
        dismiss: () => setNotice(null),
        storageError,
        busy,
        progress,
        run,
        exportAnalyses,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useApp() {
  const context = useContext(Context);
  if (!context) throw new Error('AppProvider requerido');
  return context;
}
