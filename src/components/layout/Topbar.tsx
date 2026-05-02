import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { IconChevronRight } from '@/components/icons';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface TopbarProps {
  breadcrumbs: BreadcrumbItem[];
  actions?: ReactNode;
  onMenuOpen?: () => void;
}

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
            </span>
          ))}
        </nav>
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </header>
  );
}
