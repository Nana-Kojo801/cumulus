import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';
import { IconHome, IconCalendar, IconBarChart, IconSliders } from '@/components/icons';

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
  { to: '/',          icon: IconHome,     label: 'Home',     end: true },
  { to: '/semesters', icon: IconCalendar, label: 'Semesters', end: false },
  { to: '/simulator', icon: IconBarChart, label: 'Simulate',  end: false },
  { to: '/settings',  icon: IconSliders,  label: 'Settings',  end: false },
] as const;

function MobileTabBar() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 flex bg-(--c-bg-2) border-t border-(--c-line)"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TAB_ITEMS.map(({ to, icon: Icon, label, end }) => (
        <NavLink key={to} to={to} end={end} className="flex-1">
          {({ isActive }) => (
            <div className={cn(
              'flex flex-col items-center justify-center gap-1 py-2.5 transition-colors',
              isActive ? 'text-(--c-accent)' : 'text-(--c-text-4)'
            )}>
              <motion.div
                animate={{ scale: isActive ? 1.12 : 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 22 }}
              >
                <Icon size={21} strokeWidth={isActive ? 2.2 : 1.8} />
              </motion.div>
              <span className="text-[10px] tracking-wide">{label}</span>
              {isActive && (
                <motion.span
                  layoutId="tab-indicator"
                  className="absolute bottom-[calc(env(safe-area-inset-bottom)+2px)] w-5 h-[3px] rounded-full bg-(--c-accent)"
                />
              )}
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
