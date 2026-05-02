import { useNavigate } from 'react-router-dom';
import { ChevronRight, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Topbar } from '@/components/layout/Topbar';
import { useMenuOpen } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { GradePill } from '@/components/ui/GradePill';
import { ProgressBar } from '@/components/ui/ProgressBar';

import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { useSemesters, useActiveSemester } from '@/hooks/useSemesters';
import { useCourses } from '@/hooks/useCourses';
import { useCriteria } from '@/hooks/useCriteria';
import { useScoreEntries } from '@/hooks/useScoreEntries';
import {
  cumulativeGPA, semesterGPA, courseRunningGrade, gpaHistory, letterFor,
} from '@/lib/calculations';
import { fmtGPA, fmtPct } from '@/lib/utils';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, ease: 'easeOut', delay },
});

const rowItem = {
  hidden: { opacity: 0, x: -6 },
  show: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.18, ease: 'easeOut', delay: i * 0.05 },
  }),
};

function GPARing({ gpa }: { gpa: number | null }) {
  const value = gpa ?? 0;
  const pct = (value / 4.0) * 100;
  const r = 54;
  const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;

  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="shrink-0">
      <circle cx="70" cy="70" r={r} fill="none" stroke="var(--c-surface-3)" strokeWidth="10" />
      <circle
        cx="70" cy="70" r={r}
        fill="none"
        stroke="var(--c-accent)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeDashoffset={circ / 4}
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
      <text x="70" y="66" textAnchor="middle" fill="var(--c-text)" fontSize="26" fontWeight="600" fontFamily="Inter, system-ui, sans-serif" letterSpacing="-1">
        {fmtGPA(gpa)}
      </text>
      <text x="70" y="82" textAnchor="middle" fill="var(--c-text-3)" fontSize="10" fontFamily="Inter, system-ui, sans-serif">
        out of 4.00
      </text>
    </svg>
  );
}

function Sparkline({ data }: { data: Array<{ gpa: number | null }> }) {
  const vals = data.map(d => d.gpa ?? 0);
  if (vals.length < 2) return null;
  const max = Math.max(...vals, 4);
  const min = Math.min(...vals, 0);
  const w = 80, h = 24;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * h;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke="var(--c-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function contextMessage(gpa: number | null): string {
  if (gpa === null) return 'Add your first course to get started.';
  if (gpa >= 3.5) return 'Outstanding performance. Keep it up!';
  if (gpa >= 3.0) return 'On track for honors. Stay consistent.';
  if (gpa >= 2.5) return 'Solid progress. A few strong finishes will help.';
  return 'Room to grow. Focus on your weakest subjects first.';
}

export function Dashboard() {
  const onMenuOpen = useMenuOpen();
  const navigate = useNavigate();
  const semesters = useSemesters() ?? [];
  const activeSemester = useActiveSemester();
  const allCourses = useCourses() ?? [];
  const criteria = useCriteria() ?? [];
  const entries = useScoreEntries() ?? [];

  const activeCourses = allCourses.filter(c => c.semesterId === activeSemester?.id);
  const pastSemesters = semesters.filter(s => s.status === 'complete');

  const cumulative = cumulativeGPA(semesters, allCourses, criteria, entries);
  const semGPA = activeSemester
    ? semesterGPA(activeSemester.id, allCourses, criteria, entries)
    : { gpa: null, credits: 0 };

  const activeCredits = activeCourses.reduce((acc, c) => acc + c.credits, 0);
  const completedCredits = pastSemesters.reduce((acc, s) => acc + semesterGPA(s.id, allCourses, criteria, entries).credits, 0);

  const history = gpaHistory(semesters, allCourses, criteria, entries);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar breadcrumbs={[{ label: 'Dashboard' }]} onMenuOpen={onMenuOpen} />
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">

        {/* Hero strip — staggered cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <motion.div {...fadeUp(0)} className="md:col-span-1">
            <Card className="p-5 flex flex-col gap-4 h-full bg-gradient-to-br from-(--c-surface) to-(--c-accent-bg)/40">
              <div className="flex items-center gap-5">
                <GPARing gpa={cumulative.gpa} />
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="text-[11px] uppercase tracking-[0.08em] text-(--c-text-3)">Cumulative GPA</div>
                  <div className="text-[13px] text-(--c-text-2)">{contextMessage(cumulative.gpa)}</div>
                  <div className="text-[12px] text-(--c-text-3) mt-1">{completedCredits} / 128 credits</div>
                  {history.length >= 2 && (
                    <div className="mt-2">
                      <div className="text-[10px] text-(--c-text-4) mb-1">GPA history</div>
                      <Sparkline data={history} />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div {...fadeUp(0.07)}>
            <Card className="p-5 flex flex-col gap-2 h-full">
              <div className="text-[11px] uppercase tracking-[0.08em] text-(--c-text-3)">This Semester</div>
              <div className="tabular-nums font-semibold text-(--c-text)" style={{ fontSize: '40px', letterSpacing: '-0.028em' }}>
                {fmtGPA(semGPA.gpa)}
              </div>
              <div className="text-[13px] text-(--c-text-2)">{activeSemester?.name ?? 'No active semester'}</div>
              <div className="text-[12px] text-(--c-text-3)">
                {activeCourses.length} {activeCourses.length === 1 ? 'course' : 'courses'}
              </div>
            </Card>
          </motion.div>

          <motion.div {...fadeUp(0.14)}>
            <Card className="p-5 flex flex-col gap-2 h-full">
              <div className="text-[11px] uppercase tracking-[0.08em] text-(--c-text-3)">Credits</div>
              <div className="tabular-nums font-semibold text-(--c-text)" style={{ fontSize: '40px', letterSpacing: '-0.028em' }}>
                {completedCredits}
              </div>
              <div className="text-[13px] text-(--c-text-2)">completed</div>
              {activeCredits > 0 && (
                <div className="text-[12px] text-(--c-text-3)">+{activeCredits} in progress</div>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Active Courses */}
        <motion.section {...fadeUp(0.2)}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[18px] font-medium text-(--c-text)" style={{ letterSpacing: '-0.018em' }}>
              Active Courses
            </h2>
            {activeSemester && (
              <Button variant="ghost" size="sm" onClick={() => navigate(`/semesters/${activeSemester.id}`)}>
                View semester
              </Button>
            )}
          </div>

          {activeCourses.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-(--c-text-3) text-[14px] mb-3">No courses in the active semester yet.</p>
              <Button variant="primary" size="sm" onClick={() => navigate('/courses/new')}>
                <Plus size={14} /> Add Course
              </Button>
            </Card>
          ) : (
            <Card className="divide-y divide-(--c-line) overflow-hidden">
              {activeCourses.map((course, i) => {
                const courseCriteria = criteria.filter(cr => cr.courseId === course.id);
                const courseEntries = entries.filter(e => courseCriteria.some(cr => cr.id === e.criterionId));
                const { pct, weightCompleted } = courseRunningGrade(course, courseCriteria, courseEntries);
                const letter = pct !== null ? letterFor(pct) : '—';
                return (
                  <motion.button
                    key={course.id}
                    custom={i}
                    variants={rowItem}
                    initial="hidden"
                    animate="show"
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-(--c-surface-2) transition-colors text-left cursor-pointer"
                    onClick={() => navigate(`/courses/${course.id}`)}
                  >
                    <span className="flex-1 text-[14px] text-(--c-text) truncate">{course.name}</span>
                    <Chip variant="default">{course.credits} cr</Chip>
                    <div className="w-20 hidden sm:block">
                      <ProgressBar value={weightCompleted} />
                    </div>
                    <span className="text-[14px] font-mono tabular-nums text-(--c-text-2) w-12 text-right">
                      {fmtPct(pct, 1)}
                    </span>
                    {pct !== null && letter !== '—' ? (
                      <GradePill letter={letter} size="sm" />
                    ) : (
                      <span className="w-9" />
                    )}
                    <ChevronRight size={14} className="text-(--c-text-4)" />
                  </motion.button>
                );
              })}
            </Card>
          )}
        </motion.section>

        {/* Past Semesters */}
        {pastSemesters.length > 0 && (
          <motion.section {...fadeUp(0.27)}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[18px] font-medium text-(--c-text)" style={{ letterSpacing: '-0.018em' }}>
                Past Semesters
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/semesters')}>
                View all
              </Button>
            </div>
            <Card className="divide-y divide-(--c-line) overflow-hidden">
              {pastSemesters.map((sem, i) => {
                const { gpa, credits } = semesterGPA(sem.id, allCourses, criteria, entries);
                return (
                  <motion.button
                    key={sem.id}
                    custom={i}
                    variants={rowItem}
                    initial="hidden"
                    animate="show"
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-(--c-surface-2) transition-colors text-left cursor-pointer"
                    onClick={() => navigate(`/semesters/${sem.id}`)}
                  >
                    <div className="flex-1">
                      <div className="text-[14px] text-(--c-text)">{sem.name}</div>
                      <div className="text-[12px] text-(--c-text-3)">{credits} credits</div>
                    </div>
                    <div className="text-[18px] font-semibold tabular-nums text-(--c-text)" style={{ letterSpacing: '-0.02em' }}>
                      {fmtGPA(gpa)}
                    </div>
                    <ChevronRight size={14} className="text-(--c-text-4)" />
                  </motion.button>
                );
              })}
            </Card>
          </motion.section>
        )}
      </div>
    </div>
  );
}
