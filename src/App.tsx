import { BrowserRouter } from 'react-router-dom';
import { Authenticated, Unauthenticated, AuthLoading } from 'convex/react';
import { AppShell } from '@/components/layout/AppShell';
import { ToastContainer } from '@/components/ui/Toast';
<<<<<<< HEAD
import { AuthScreen } from '@/screens/AuthScreen';
import { ThemeProvider } from '@/contexts/ThemeContext';
=======
import { Dashboard } from '@/screens/Dashboard';
import { Semesters } from '@/screens/Semesters';
import { SemesterDetail } from '@/screens/SemesterDetail';
import { CourseDetail } from '@/screens/CourseDetail';
import { CourseEdit } from '@/screens/CourseEdit';
import { Simulator } from '@/screens/Simulator';
import { Settings } from '@/screens/Settings';
import { CanvasSyncPreview } from '@/screens/CanvasSyncPreview';

export default function App() {
  const location = useLocation();
>>>>>>> f015a05a7e316a7e27334f0db0dad84b1bacc6e6

function LoadingSpinner() {
  return (
<<<<<<< HEAD
    <div className="h-screen flex items-center justify-center bg-(--c-bg)">
      <div
        className="w-7 h-7 rounded-full animate-spin"
        style={{ border: '2px solid var(--c-line-2)', borderTopColor: 'var(--c-accent)' }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastContainer>
        <BrowserRouter>
          <AuthLoading>
            <LoadingSpinner />
          </AuthLoading>

          <Unauthenticated>
            <AuthScreen />
          </Unauthenticated>

          <Authenticated>
            <AppShell />
          </Authenticated>
        </BrowserRouter>
      </ToastContainer>
    </ThemeProvider>
=======
    <ToastContainer>
      <AppShell>
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
      </AppShell>
    </ToastContainer>
>>>>>>> f015a05a7e316a7e27334f0db0dad84b1bacc6e6
  );
}
