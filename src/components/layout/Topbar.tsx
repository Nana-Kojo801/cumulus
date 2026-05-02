import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface TopbarProps {
  breadcrumbs: BreadcrumbItem[];
  actions?: ReactNode;
  onMenuOpen?: () => void;
}

export function Topbar({ breadcrumbs, actions, onMenuOpen }: TopbarProps) {
  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-(--c-line) bg-(--c-bg-2) shrink-0 gap-2">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <nav className="flex items-center gap-1 min-w-0 overflow-hidden">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1 min-w-0 shrink-0 last:min-w-0 last:shrink">
              {i > 0 && <ChevronRight size={12} className="text-(--c-text-4) shrink-0" />}
              {crumb.to ? (
                <Link
                  to={crumb.to}
                  className="text-[13px] text-(--c-text-3) hover:text-(--c-text) transition-colors truncate hidden sm:block"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-[13px] text-(--c-text) truncate font-medium">{crumb.label}</span>
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
