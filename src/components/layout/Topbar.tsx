<<<<<<< HEAD
import { useNavigate } from 'react-router-dom';
import { IconChevronLeft } from '@/components/icons';
=======
import { Link } from 'react-router-dom';
>>>>>>> f015a05a7e316a7e27334f0db0dad84b1bacc6e6
import type { ReactNode } from 'react';
import { IconChevronRight } from '@/components/icons';

interface TopbarProps {
  title: string;
  back?: string;
  actions?: ReactNode;
  onMenuOpen?: () => void;
}

<<<<<<< HEAD
export function Topbar({ title, back, actions }: TopbarProps) {
  const navigate = useNavigate();
  return (
    <header
      className="flex items-center justify-between px-6 border-b border-(--c-line) shrink-0 gap-2"
      style={{
        minHeight: 56,
        background: 'var(--c-topbar-bg, rgba(255,255,255,0.6))',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-center gap-1 min-w-0 flex-1">
        {back ? (
          <>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 shrink-0 cursor-pointer -ml-2 px-2 min-h-11 rounded-[10px] hover:bg-(--c-surface-2) transition-colors"
              style={{ color: 'var(--c-text-3)' }}
            >
              <IconChevronLeft size={18} strokeWidth={2.2} />
              <span
                className="max-w-20 sm:max-w-40 truncate leading-none"
                style={{ fontSize: 13, fontWeight: 600 }}
              >
                {back}
              </span>
            </button>
            <span className="text-(--c-line-2) text-[14px] shrink-0 select-none mx-0.5">/</span>
            <span
              className="truncate min-w-0"
              style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-text)', letterSpacing: '-0.01em' }}
            >
              {title}
=======
export function Topbar({ breadcrumbs, actions }: TopbarProps) {
  return (
    <header className="h-12 flex items-center justify-between px-5 border-b border-(--c-line) bg-(--c-bg-2) shrink-0 gap-3">
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <nav className="flex items-center gap-1 min-w-0 overflow-hidden">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1 min-w-0 shrink-0 last:min-w-0 last:shrink">
              {i > 0 && <IconChevronRight size={11} className="text-(--c-text-4) shrink-0" />}
              {crumb.to ? (
                <Link
                  to={crumb.to}
                  className="text-[13px] text-(--c-text-3) hover:text-(--c-text) transition-colors truncate hidden sm:block"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-[13px] font-semibold text-(--c-text) truncate">{crumb.label}</span>
              )}
>>>>>>> f015a05a7e316a7e27334f0db0dad84b1bacc6e6
            </span>
          </>
        ) : (
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--c-text)',
              letterSpacing: '-0.02em',
              fontFamily: 'var(--f-ui)',
            }}
          >
            {title}
          </span>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </header>
  );
}
