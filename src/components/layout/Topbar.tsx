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
              className="flex items-center justify-center shrink-0 cursor-pointer -ml-2 w-10 h-10 rounded-[10px] hover:bg-(--c-surface-2) transition-colors"
              style={{ color: 'var(--c-text-3)' }}
              title="Go back"
            >
              <IconChevronLeft size={20} strokeWidth={2.5} />
            </button>
            <span
              className="truncate min-w-0 ml-1"
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
