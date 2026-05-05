import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Routes, Route, useLocation, NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery } from 'convex/react';
import { useUser } from '@clerk/clerk-react';
import { api } from '../../../convex/_generated/api';
import { IconHome, IconCalendar, IconBarChart, IconSliders } from '@/components/icons';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';
import { useSyncContext } from '@/contexts/SyncContext';
import { useOnlineStatus } from '@/lib/useOnlineStatus';
import { clearAllLocalData, hasAnyLocalData, localDb } from '@/lib/localDb';

import { Dashboard } from '@/screens/Dashboard';
import { Semesters } from '@/screens/Semesters';
import { SemesterDetail } from '@/screens/SemesterDetail';
import { CourseDetail } from '@/screens/CourseDetail';
import { CourseEdit } from '@/screens/CourseEdit';
import { Simulator } from '@/screens/Simulator';
import { Settings } from '@/screens/Settings';
import { CanvasSyncPreview } from '@/screens/CanvasSyncPreview';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { AuthScreen } from '@/screens/AuthScreen';

const MenuContext = createContext<{ open: () => void }>({ open: () => {} });
export function useMenuOpen() { return useContext(MenuContext).open; }

const USER_CACHE_KEY = 'cumulus-user-v1';

function LoadingSpinner() {
  return (
    <div className="h-screen flex items-center justify-center" style={{ background: 'var(--c-bg)' }}>
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
  const { isLoaded: clerkLoaded, isSignedIn } = useUser();
  const convexUser = useQuery(api.users.current);
  const { isOnline, pendingCount } = useSyncContext();
  const browserOnline = useOnlineStatus();

  const [cachedUser, setCachedUser] = useState<{ onboardingComplete: boolean } | null>(() => {
    try { return JSON.parse(localStorage.getItem(USER_CACHE_KEY) ?? 'null'); } catch { return null; }
  });
  const [offlineBootReady, setOfflineBootReady] = useState(false);
  const [hasOfflineData, setHasOfflineData] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [hasData, cachedDbUser] = await Promise.all([
        hasAnyLocalData(),
        localDb.userCache.get('current'),
      ]);
      if (cancelled) return;
      setHasOfflineData(hasData);
      if (!cachedUser && cachedDbUser) {
        setCachedUser({ onboardingComplete: cachedDbUser.onboardingComplete });
      }
      setOfflineBootReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (convexUser) {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(convexUser));
      setCachedUser(convexUser);
      void localDb.userCache.put({
        id: 'current',
        name: '',
        email: '',
        onboardingComplete: convexUser.onboardingComplete,
      });
    }
  }, [convexUser]);

  useEffect(() => {
    // If user has no valid session while online, clear stale local data.
    if (!clerkLoaded || isSignedIn || !browserOnline) return;
    void clearAllLocalData();
    localStorage.removeItem(USER_CACHE_KEY);
    setCachedUser(null);
    setHasOfflineData(false);
  }, [clerkLoaded, isSignedIn, browserOnline]);

  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const openMenu = useCallback(() => {}, []);

  const offlineCanBoot = !browserOnline && offlineBootReady && hasOfflineData && !!cachedUser;
  if (!clerkLoaded && !offlineCanBoot) return <LoadingSpinner />;
  if (clerkLoaded && !isSignedIn && !offlineCanBoot) return <AuthScreen />;

  const effectiveUser = convexUser ?? cachedUser;
  if (convexUser === undefined && !cachedUser) return <LoadingSpinner />;
  if (!effectiveUser || !effectiveUser.onboardingComplete) return <OnboardingScreen />;

  const isMobile = width <= 640;
  const isTablet = width > 640 && width <= 900;

  return (
    <MenuContext.Provider value={{ open: openMenu }}>
      <div className="c-app flex h-full overflow-hidden relative">
        {!isMobile && <Sidebar collapsed={isTablet} />}
        <main className={cn('flex-1 flex flex-col overflow-hidden min-w-0 relative z-[1]', isMobile && 'pb-16')}>
          <AppRoutes />
        </main>
      </div>

      {/* Offline / sync indicator */}
      <AnimatePresence>
        {(!isOnline || pendingCount > 0) && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed top-0 inset-x-0 z-[500] flex items-center justify-center py-1.5 text-[11px] font-semibold gap-2"
            style={{
              background: isOnline ? 'var(--c-accent)' : 'var(--c-grade-c)',
              color: 'white',
            }}
          >
            {isOnline ? (
              <>
                <div className="w-2 h-2 rounded-full bg-white/70 animate-pulse" />
                Syncing {pendingCount} change{pendingCount !== 1 ? 's' : ''}…
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-white/70" />
                Offline — changes saved locally
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {isMobile && <MobileTabBar />}
    </MenuContext.Provider>
  );
}

const TAB_ITEMS = [
  { to: '/',          icon: IconHome,     label: 'Home',      end: true },
  { to: '/semesters', icon: IconCalendar, label: 'Semesters', end: false },
  { to: '/simulator', icon: IconBarChart, label: 'Simulate',  end: false },
  { to: '/settings',  icon: IconSliders,  label: 'Settings',  end: false },
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
                  transition: 'color 150ms',
                }}
              >
                {label}
              </span>
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
