<<<<<<< HEAD
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Routes, Route, useLocation, NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { IconHome, IconCalendar, IconBarChart, IconSliders } from '@/components/icons';
=======
import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
>>>>>>> f015a05a7e316a7e27334f0db0dad84b1bacc6e6
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';
import { IconHome, IconCalendar, IconBarChart, IconSliders } from '@/components/icons';

import { Dashboard } from '@/screens/Dashboard';
import { Semesters } from '@/screens/Semesters';
import { SemesterDetail } from '@/screens/SemesterDetail';
import { CourseDetail } from '@/screens/CourseDetail';
import { CourseEdit } from '@/screens/CourseEdit';
import { Simulator } from '@/screens/Simulator';
import { Settings } from '@/screens/Settings';
import { CanvasSyncPreview } from '@/screens/CanvasSyncPreview';
import { OnboardingScreen } from '@/screens/OnboardingScreen';

const MenuContext = createContext<{ open: () => void }>({ open: () => {} });
export function useMenuOpen() { return useContext(MenuContext).open; }

function LoadingSpinner() {
  return (
    <div className="h-screen flex items-center justify-center bg-(--c-bg)">
      <div
        className="w-7 h-7 rounded-full animate-spin"
        style={{ border: '2px solid var(--c-line-2)', borderTopColor: 'var(--c-accent)' }}
      />
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.key}
        className="flex-1 flex flex-col overflow-hidden min-w-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <Routes location={location}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/semesters" element={<Semesters />} />
          <Route path="/semesters/:id" element={<SemesterDetail />} />
          <Route path="/courses/new" element={<CourseEdit />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/courses/:id/edit" element={<CourseEdit />} />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/canvas/sync" element={<CanvasSyncPreview />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export function AppShell() {
  const user = useQuery(api.users.current);
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const openMenu = useCallback(() => {}, []);

  if (user === undefined || user === null) return <LoadingSpinner />;

  if (!user.onboardingComplete) return <OnboardingScreen />;

  const isMobile = width <= 640;
  const isTablet = width > 640 && width <= 900;

  return (
    <MenuContext.Provider value={{ open: openMenu }}>
      <div className="c-app flex h-full overflow-hidden relative">
        {!isMobile && <Sidebar collapsed={isTablet} />}
<<<<<<< HEAD

        <main className={cn('flex-1 flex flex-col overflow-hidden min-w-0 relative z-[1]', isMobile && 'pb-16')}>
          <AppRoutes />
=======
        <main className={cn('flex-1 flex flex-col overflow-hidden min-w-0', isMobile && 'pb-16')}>
          {children}
>>>>>>> f015a05a7e316a7e27334f0db0dad84b1bacc6e6
        </main>
      </div>
      {isMobile && <MobileTabBar />}
    </MenuContext.Provider>
  );
}

const TAB_ITEMS = [
<<<<<<< HEAD
  { to: '/',          icon: IconHome,      label: 'Home',      end: true },
  { to: '/semesters', icon: IconCalendar,  label: 'Semesters', end: false },
  { to: '/simulator', icon: IconBarChart,  label: 'Simulate',  end: false },
  { to: '/settings',  icon: IconSliders,   label: 'Settings',  end: false },
=======
  { to: '/',          icon: IconHome,     label: 'Home',     end: true },
  { to: '/semesters', icon: IconCalendar, label: 'Semesters', end: false },
  { to: '/simulator', icon: IconBarChart, label: 'Simulate',  end: false },
  { to: '/settings',  icon: IconSliders,  label: 'Settings',  end: false },
>>>>>>> f015a05a7e316a7e27334f0db0dad84b1bacc6e6
] as const;

function MobileTabBar() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 flex"
      style={{
        background: 'var(--c-surface)',
        borderTop: '1px solid var(--c-line)',
        borderRadius: '20px 20px 0 0',
        boxShadow: '0 -4px 28px oklch(0 0 0 / 0.10)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {TAB_ITEMS.map(({ to, icon: Icon, label, end }) => (
        <NavLink key={to} to={to} end={end} className="flex-1">
          {({ isActive }) => (
<<<<<<< HEAD
            <div className="flex flex-col items-center gap-0.5 py-2.5">
              <motion.div
                style={{
                  padding: '5px 18px',
                  borderRadius: 999,
                  background: isActive ? 'var(--c-accent-bg)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                animate={{ scale: isActive ? 1.05 : 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.3 : 1.7}
                  style={{ color: isActive ? 'var(--c-accent)' : 'var(--c-text-4)', transition: 'color 150ms' }}
                />
              </motion.div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--c-accent)' : 'var(--c-text-4)',
                  letterSpacing: '0.02em',
                  transition: 'color 150ms, font-weight 150ms',
                }}
              >
                {label}
              </span>
=======
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
>>>>>>> f015a05a7e316a7e27334f0db0dad84b1bacc6e6
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
