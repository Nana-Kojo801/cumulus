import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, TrendingUp, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

const MenuContext = createContext<{ open: () => void }>({ open: () => {} });
export function useMenuOpen() { return useContext(MenuContext).open; }

export function AppShell({ children }: { children: ReactNode }) {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const isMobile = width <= 640;
  const isTablet = width > 640 && width <= 900;
  const openMenu = useCallback(() => {}, []);

  return (
    <MenuContext.Provider value={{ open: openMenu }}>
      <div className="flex h-full overflow-hidden bg-(--c-bg)">
        {!isMobile && <Sidebar collapsed={isTablet} />}

        <main className={cn('flex-1 flex flex-col overflow-hidden min-w-0', isMobile && 'pb-16')}>
          {children}
        </main>
      </div>

      {isMobile && <MobileTabBar />}
    </MenuContext.Provider>
  );
}

const TAB_ITEMS = [
  { to: '/',          icon: LayoutDashboard, label: 'Home',      end: true },
  { to: '/semesters', icon: BookOpen,        label: 'Semesters', end: false },
  { to: '/simulator', icon: TrendingUp,      label: 'Simulate',  end: false },
  { to: '/settings',  icon: Settings,        label: 'Settings',  end: false },
] as const;

function MobileTabBar() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 flex bg-(--c-bg-2) border-t border-(--c-line)"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TAB_ITEMS.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] tracking-wide transition-colors',
              isActive ? 'text-(--c-accent)' : 'text-(--c-text-4)'
            )
          }
        >
          {({ isActive }) => (
            <>
              <motion.div
                animate={{ scale: isActive ? 1.15 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
              </motion.div>
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
