import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  ScanLine,
  Images,
  Bell,
  History,
  SlidersHorizontal,
  Settings,
  BookOpen,
  LogOut,
  ChevronRight,
  Menu,
  Search,
  ArrowRight,
  Check,
  CircleHelp,
  X,
} from 'lucide-react';
import { useApp } from './providers/AppProvider';
import { canConfigure, roles, type Role } from '../core/domain/model';
import { assetUrl, Badge, Empty, Logo, Notice } from '../shared/ui';
import { DashboardPage } from '../modules/dashboard/pages/DashboardPage';
import { AnalysisPage } from '../modules/analysis/pages/AnalysisPage';
import { AlertsPage } from '../modules/alerts/pages/AlertsPage';
import { HistoryPage } from '../modules/history/pages/HistoryPage';
import { ScenariosPage } from '../modules/scenarios/pages/ScenariosPage';
import { RulesPage } from '../modules/patterns/pages/RulesPage';
import { SettingsPage } from '../modules/settings/pages/SettingsPage';
import { GuidePage } from '../modules/guide/GuidePage';

const nav = [
  { path: 'dashboard', label: 'Resumen general', Icon: LayoutDashboard, group: 'WORKSPACE' },
  { path: 'analysis', label: 'Centro de análisis', Icon: ScanLine },
  { path: 'scenarios', label: 'Escenarios demo', Icon: Images },
  { path: 'alerts', label: 'Alertas', Icon: Bell, group: 'OPERACIONES' },
  { path: 'history', label: 'Historial', Icon: History },
  {
    path: 'rules',
    label: 'Reglas y patrones',
    Icon: SlidersHorizontal,
    group: 'ADMINISTRACIÓN',
    admin: true,
  },
  { path: 'settings', label: 'Configuración', Icon: Settings, admin: true },
];
function Login() {
  const { login } = useApp();
  const [name, setName] = useState(''),
    [role, setRole] = useState<Role>('admin');
  return (
    <div className="login-page">
      <section className="login-story">
        <Logo />
        <div className="login-story-content">
          <Badge tone="glass">VISIÓN COMPUTACIONAL · DEMO</Badge>
          <h1>
            Una nueva forma <br />
            de ver tu <br />
            <em>operación.</em>
          </h1>
          <p>
            De imágenes a hallazgos.
            <br />
            De hallazgos a decisiones informadas.
          </p>
          <div className="login-scene">
            <img
              src={assetUrl('/scenes/industrial.svg')}
              alt="Escena ilustrada de seguridad industrial"
            />
            <span className="login-scan a">
              Persona <b>97%</b>
            </span>
            <span className="login-scan b">
              Casco <b>96%</b>
            </span>
            <div className="login-scene-footer">
              <span className="status-dot" />
              ENTORNO DE DEMOSTRACIÓN
            </div>
          </div>
        </div>
        <small>DETECCIÓN / SEGMENTACIÓN / PATRONES</small>
      </section>
      <main className="login-form-panel">
        <div className="login-form">
          <span className="overline">BIENVENIDO A NEXUSVISION</span>
          <h2>
            Explora lo que <br />
            tus imágenes cuentan.
          </h2>
          <p className="muted">
            Entra al espacio de demostración. Todo está listo para tu primer análisis.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              login({ name: name.trim() || 'Usuario DEMO', role });
            }}
          >
            <label>
              Tu nombre <span className="optional">(opcional)</span>
              <input
                autoComplete="given-name"
                placeholder="¿Cómo te llamas?"
                maxLength={60}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Perfil de demostración
              <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                {Object.entries(roles).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <div className="login-permission">
              <Check size={16} />
              {role === 'admin'
                ? 'Acceso a todos los módulos y configuraciones'
                : role === 'operator'
                  ? 'Ejecuta análisis y consulta resultados'
                  : role === 'supervisor'
                    ? 'Ejecuta análisis y revisa alertas'
                    : 'Consulta historial, resultados y reportes'}
            </div>
            <button className="button primary full-width" type="submit">
              Entrar a la demo <ArrowRight size={18} />
            </button>
          </form>
          <p className="login-disclaimer">
            <CircleHelp size={17} />
            <span>
              Acceso simulado, sin contraseña. Los resultados son ejemplos predefinidos; no se
              ejecuta IA real.
            </span>
          </p>
        </div>
        <footer>
          NexusVision <span>Un proyecto para aprender mirando.</span>
        </footer>
      </main>
    </div>
  );
}
export function App() {
  const { session, logout, state, storageError, busy } = useApp();
  const [hash, setHash] = useState(location.hash || '#/dashboard'),
    [mobile, setMobile] = useState(false),
    [search, setSearch] = useState('');
  useEffect(() => {
    const handler = () => {
      setHash(location.hash || '#/dashboard');
      setMobile(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  const [path, queryString] = hash.replace(/^#\/?/, '').split('?');
  const query = new URLSearchParams(queryString);
  const active = nav.find((n) => n.path === path);
  const newAlerts = state.alerts.filter((a) => a.status === 'new').length;
  useEffect(() => {
    document.title = `${active?.label ?? (path === 'guide' ? 'Guía de uso' : 'NexusVision')} · NexusVision`;
  }, [active?.label, path]);
  if (!session)
    return (
      <>
        <Login />
        <Notice />
      </>
    );
  const restricted = (path === 'rules' || path === 'settings') && !canConfigure(session.role);
  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main-content')?.focus();
        }}
      >
        Saltar al contenido
      </a>
      {mobile && (
        <button
          className="sidebar-backdrop"
          aria-label="Cerrar menú"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sidebar ${mobile ? 'open' : ''}`}>
        <a href="#/dashboard" aria-label="NexusVision inicio">
          <Logo />
        </a>
        <div className="workspace-label">
          <span className="workspace-avatar">NV</span>
          <div>
            Espacio de trabajo<small>Proyecto de demostración</small>
          </div>
        </div>
        <nav aria-label="Menú principal">
          {nav
            .filter((n) => !n.admin || canConfigure(session.role))
            .map(({ path: p, label, Icon, group }) => (
              <div key={p}>
                {group && <p className="nav-group">{group}</p>}
                <a
                  href={`#/${p}`}
                  className={`nav-link ${path === p ? 'active' : ''}`}
                  aria-current={path === p ? 'page' : undefined}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                  {p === 'alerts' && newAlerts > 0 && <b>{newAlerts}</b>}
                </a>
              </div>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <a href="#/guide" className={`guide-link ${path === 'guide' ? 'active' : ''}`}>
            <BookOpen size={18} />
            <span>
              Tu primera demostración<small>Conoce el flujo, paso a paso</small>
            </span>
            <ChevronRight size={14} />
          </a>
          <div className="sidebar-status">
            <span className="status-dot" />
            Entorno local <span>v1.0</span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button mobile-menu"
              aria-label="Abrir menú"
              onClick={() => setMobile(true)}
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{active?.label ?? 'Guía de uso'}</strong>
          </div>
          <div className="topbar-actions">
            <form
              className="global-search"
              onSubmit={(e) => {
                e.preventDefault();
                location.hash = `/history?q=${encodeURIComponent(search)}`;
                setSearch('');
              }}
            >
              <Search size={16} />
              <input
                aria-label="Buscar análisis"
                placeholder="Buscar un análisis…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
            <Badge tone="teal">
              <span className="status-dot" />
              MODO DEMO
            </Badge>
            <a
              className="icon-button notification-button"
              href="#/alerts"
              aria-label={`${newAlerts} alertas nuevas`}
            >
              <Bell size={19} />
              {newAlerts > 0 && <i />}
            </a>
            <span className="header-divider" />
            <div className="profile">
              <span className="profile-avatar">{session.name.slice(0, 2).toUpperCase()}</span>
              <div>
                <strong>{session.name}</strong>
                <small>{roles[session.role]}</small>
              </div>
            </div>
            <button
              className="icon-button"
              disabled={busy}
              onClick={logout}
              aria-label="Cerrar sesión o cambiar perfil"
              title="Cambiar perfil"
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>
        <main id="main-content" className="main-content" tabIndex={-1}>
          {storageError && (
            <div className="storage-error" role="alert">
              {storageError}
            </div>
          )}
          {restricted ? (
            <Empty title="Este módulo requiere perfil Administrador">
              Cierra la sesión y elige Administrador para configurar la demo.
            </Empty>
          ) : (
            <div key={hash} className="page-enter">
              {path === 'dashboard' ? (
                <DashboardPage />
              ) : path === 'analysis' ? (
                <AnalysisPage query={query} />
              ) : path === 'alerts' ? (
                <AlertsPage query={query} />
              ) : path === 'history' ? (
                <HistoryPage query={query} />
              ) : path === 'scenarios' ? (
                <ScenariosPage />
              ) : path === 'rules' ? (
                <RulesPage />
              ) : path === 'settings' ? (
                <SettingsPage />
              ) : path === 'guide' ? (
                <GuidePage />
              ) : (
                <Empty title="Esta página no existe">
                  <a href="#/dashboard">Volver al resumen general</a>
                </Empty>
              )}
            </div>
          )}
        </main>
        <footer className="app-footer">
          <span>NexusVision · Plataforma de análisis visual</span>
          <span>Simulación funcional. Revisión humana siempre.</span>
        </footer>
      </div>
      <Notice />
      {mobile && (
        <button
          className="close-mobile icon-button"
          aria-label="Cerrar navegación"
          onClick={() => setMobile(false)}
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
}
