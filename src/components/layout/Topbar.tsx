import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { IconChevronLeft } from '@/components/icons';

interface TopbarProps {
  title: string;
  back?: string;
  actions?: ReactNode;
  onMenuOpen?: () => void;
}

export function Topbar({ title, back, actions }: TopbarProps) {
  const navigate = useNavigate();
  return (
    <header
      className="flex items-center justify-between px-6 border-b border-(--c-line) shrink-0 gap-2"
      style={{
        minHeight: 56,
        background: 'var(--c-topbar-bg)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
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
