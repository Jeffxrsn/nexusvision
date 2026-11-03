import { Box, ChevronRight, Inbox, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useApp } from '../../app/providers/AppProvider';
export const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
export const percent = (v: number) => `${Math.round(v * 100)}%`;
export const dateTime = (v: string) =>
  new Date(v).toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
export const shortId = (v: string) =>
  v.startsWith('demo-') ? v.toUpperCase() : `NV-${v.slice(0, 6).toUpperCase()}`;
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <span className="brand-symbol">
        <Box size={24} />
      </span>
      {!compact && (
        <div>
          Nexus<span>Vision</span>
          <small>INTELIGENCIA VISUAL</small>
        </div>
      )}
    </div>
  );
}
export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: string }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      <div className="page-actions">{children}</div>
    </div>
  );
}
export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <span>
        <Inbox size={30} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function SectionTitle({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {description && <p className="muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}
export function LinkButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="text-button" href={href}>
      {children}
      <ChevronRight size={15} />
    </a>
  );
}
export function Notice() {
  const { notice, dismiss } = useApp();
  return notice ? (
    <div role={notice.tone === 'error' ? 'alert' : 'status'} className={`toast ${notice.tone}`}>
      <span>{notice.text}</span>
      <button className="icon-button" aria-label="Cerrar notificación" onClick={dismiss}>
        <X size={16} />
      </button>
    </div>
  ) : null;
}
