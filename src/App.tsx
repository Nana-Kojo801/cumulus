import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AppShell } from '@/components/layout/AppShell';
import { ToastContainer } from '@/components/ui/Toast';
import { Dashboard } from '@/screens/Dashboard';
import { Semesters } from '@/screens/Semesters';
import { SemesterDetail } from '@/screens/SemesterDetail';
import { CourseDetail } from '@/screens/CourseDetail';
import { CourseEdit } from '@/screens/CourseEdit';
import { Simulator } from '@/screens/Simulator';
import { Settings } from '@/screens/Settings';
import { TemplateImport } from '@/screens/TemplateImport';
import { CanvasSyncPreview } from '@/screens/CanvasSyncPreview';

export default function App() {
  const location = useLocation();

  return (
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
              <Route path="/import" element={<TemplateImport />} />
              <Route path="/canvas/sync" element={<CanvasSyncPreview />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </AppShell>
    </ToastContainer>
  );
}
