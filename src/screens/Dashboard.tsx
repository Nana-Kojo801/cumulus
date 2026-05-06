import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconChevronRight, IconPlus } from '@/components/icons';
import { motion } from 'framer-motion';
import { Topbar } from '@/components/layout/Topbar';
import { useMenuOpen } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { useSemesters, useActiveSemester } from '@/hooks/useSemesters';
import { useCourses } from '@/hooks/useCourses';
import { useCriteria } from '@/hooks/useCriteria';
import { useScoreEntries } from '@/hooks/useScoreEntries';
import {
  cumulativeGPA, semesterGPA, gpaHistory, honorFor, courseRunningGrade, letterFor
} from '@/lib/calculations';
import { fmtGPA, fmtPct, displayCourseName } from '@/lib/utils';
import { useDisplayPrefs } from '@/contexts/DisplayPrefsContext';
import { GradePill } from '@/components/ui/GradePill';

const rowItem = {
  hidden: { opacity: 0, x: -6 },
  show: (i: number) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.18, ease: 'easeOut' as const, delay: i * 0.05 },
  }),
};

function GPARing({ gpa }: { gpa: number | null }) {
  const value = gpa ?? 0;
  const r = 68;
  const c = 2 * Math.PI * r;
  const off = c - (value / 4) * c;
  const size = 180;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 4,
      }}>
        <span style={{
          fontFamily: 'var(--f-display)',
          fontSize: 46,
          fontWeight: 500,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          color: 'white',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {fmtGPA(gpa)}
        </span>
        <span style={{
          fontSize: 11,
          color: 'rgba(255,255,255,0.65)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}>
          out of 4.00
        </span>
      </div>
    </div>
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
      <polyline points={pts} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

function DashboardSkeleton() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Dashboard" />
      <div className="flex-1 overflow-y-auto p-5 lg:p-7 flex flex-col gap-6">
        <div className="skeleton rounded-[20px]" style={{ height: 160 }} />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[0, 1, 2].map(i => <div key={i} className="skeleton rounded-[16px]" style={{ height: 80 }} />)}
        </div>
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 48 }} />)}
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const onMenuOpen = useMenuOpen();
  const navigate = useNavigate();
  const { showShortNames } = useDisplayPrefs();
  const rawSemesters = useSemesters();
  const activeSemester = useActiveSemester();
  const rawCourses = useCourses();
  const rawCriteria = useCriteria();
  const rawEntries = useScoreEntries();

  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  function toggleOpen(id: string) {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (rawSemesters === undefined || rawCourses === undefined) return <DashboardSkeleton />;

  const semesters = rawSemesters;
  const allCourses = rawCourses;
  const criteria = rawCriteria ?? [];
  const entries = rawEntries ?? [];

  const activeCourses = allCourses.filter(c => c.semesterId === activeSemester?.id);
  const pastSemesters = semesters.filter(s => s.status === 'complete');

  const cumulative = cumulativeGPA(semesters, allCourses, criteria, entries);
  const semGPA = activeSemester
    ? semesterGPA(activeSemester.id, allCourses, criteria, entries)
    : { gpa: null, credits: 0 };

  const activeCredits = activeCourses.reduce((acc, c) => acc + c.credits, 0);
  const completedCredits = pastSemesters.reduce(
    (acc, s) => acc + allCourses.filter(c => c.semesterId === s.id).reduce((a, c) => a + c.credits, 0), 0
  );
  const history = gpaHistory(semesters, allCourses, criteria, entries);
  const honor = honorFor(cumulative.gpa);

  let heroStyle: React.CSSProperties = {};
  let honorIconColor = 'rgba(255,255,255,0.9)';
  
  if (honor === 'Summa Cum Laude') {
    heroStyle.background = 'linear-gradient(135deg, oklch(0.55 0.18 80) 0%, oklch(0.35 0.15 75) 100%)';
    honorIconColor = 'oklch(0.85 0.15 85)';
  } else if (honor === 'Magna Cum Laude') {
    heroStyle.background = 'linear-gradient(135deg, oklch(0.50 0.06 250) 0%, oklch(0.35 0.04 250) 100%)';
    honorIconColor = 'oklch(0.85 0.03 250)';
  } else if (honor === 'Cum Laude') {
    heroStyle.background = 'linear-gradient(135deg, oklch(0.48 0.12 40) 0%, oklch(0.33 0.10 35) 100%)';
    honorIconColor = 'oklch(0.80 0.12 50)';
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Dashboard" onMenuOpen={onMenuOpen} />
      <div className="flex-1 overflow-y-auto p-5 lg:p-7 flex flex-col gap-6">

        {/* Hero card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="hero-card" style={heroStyle}>
            {/* Mobile layout */}
            <div className="sm:hidden relative z-10 flex flex-col gap-3">
              <div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
                  Cumulative GPA
                </div>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: 64, fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 1, color: 'white' }}>
                  {fmtGPA(cumulative.gpa)}
                </div>
                {honor && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', marginTop: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 999, padding: '3px 10px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: honorIconColor }}>✦ {honor}</span>
                  </div>
                )}
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                {contextMessage(cumulative.gpa)}
              </p>
              <div className="flex gap-3 flex-wrap">
                <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 14px' }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 2 }}>Semester</div>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, fontWeight: 500, letterSpacing: '-0.03em', color: 'white' }}>{fmtGPA(semGPA.gpa)}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 14px' }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 2 }}>Earned Credits</div>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, fontWeight: 500, letterSpacing: '-0.03em', color: 'white' }}>{completedCredits}</div>
                </div>
              </div>
            </div>
            {/* Desktop layout */}
            <div className="hidden sm:flex relative z-10 items-center gap-6">
              <GPARing gpa={cumulative.gpa} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>
                    Cumulative GPA
                  </div>
                  {honor && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,0.15)', borderRadius: 999, padding: '2px 10px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: honorIconColor }}>✦ {honor}</span>
                    </div>
                  )}
                </div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 16, lineHeight: 1.5 }}>
                  {contextMessage(cumulative.gpa)}
                </p>
                <div className="flex flex-wrap gap-3">
                  <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 16px' }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 2 }}>This Semester</div>
                    <div style={{ fontFamily: 'var(--f-display)', fontSize: 28, fontWeight: 500, letterSpacing: '-0.03em', color: 'white' }}>{fmtGPA(semGPA.gpa)}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 16px' }}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 2 }}>Earned Credits</div>
                    <div style={{ fontFamily: 'var(--f-display)', fontSize: 28, fontWeight: 500, letterSpacing: '-0.03em', color: 'white' }}>{completedCredits}</div>
                  </div>
                  {history.length >= 2 && (
                    <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
                      <Sparkline data={history} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Active semester quick stats */}
        {activeSemester && activeCourses.length > 0 && (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 gap-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.12 }}
          >
            <div className="c-card p-4">
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-text-4)', fontWeight: 700, marginBottom: 6 }}>
                Semester GPA
              </div>
              <div className="c-bignum" style={{ fontSize: 32 }}>{fmtGPA(semGPA.gpa)}</div>
            </div>
            <div className="c-card p-4">
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-text-4)', fontWeight: 700, marginBottom: 6 }}>
                In Progress
              </div>
              <div className="c-bignum" style={{ fontSize: 32 }}>{activeCredits}<span style={{ fontSize: 16, color: 'var(--c-text-3)', marginLeft: 4 }}>cr</span></div>
            </div>
            <div className="c-card p-4 hidden sm:block">
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-text-4)', fontWeight: 700, marginBottom: 6 }}>
                Courses
              </div>
              <div className="c-bignum" style={{ fontSize: 32 }}>{activeCourses.length}</div>
            </div>
          </motion.div>
        )}

        {/* Active Courses */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="c-section-head" style={{ margin: 0 }}>
              <h2>Active Courses</h2>
              {activeSemester && (
                <span className="sub">{activeSemester.name}</span>
              )}
            </div>
            </div>

          {activeCourses.length === 0 ? (
            <div
              style={{
                padding: '48px 24px',
                border: '1.5px dashed var(--c-line-2)',
                borderRadius: 'var(--r-4)',
                textAlign: 'center',
                color: 'var(--c-text-3)',
              }}
            >
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, color: 'var(--c-text-2)', marginBottom: 8 }}>
                No courses yet
              </div>
              <p style={{ fontSize: 13, marginBottom: 18 }}>Add courses to start tracking your GPA.</p>
              <Button variant="primary" size="sm" onClick={() => navigate('/courses/new')}>
                <IconPlus size={14} /> Add Course
              </Button>
            </div>
          ) : (
            <div className="flex flex-col">
              {activeCourses.map((course, i) => (
                <motion.button
                  key={course.id}
                  custom={i}
                  variants={rowItem}
                  initial="hidden"
                  animate="show"
                  className="w-full flex items-center gap-3 px-2 py-3 hover:bg-(--c-surface-2) transition-colors text-left cursor-pointer"
                  style={{ borderBottom: i < activeCourses.length - 1 ? '1px solid var(--c-line)' : 'none' }}
                  onClick={() => navigate(`/courses/${course.id}`)}
                >
                  <span className="flex-1 min-w-0 truncate" style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text)' }}>
                    {displayCourseName(course, showShortNames)}
                  </span>
                  <IconChevronRight size={14} className="text-(--c-text-4)" />
                </motion.button>
              ))}
            </div>
          )}
        </motion.section>

        {/* Past Semesters */}
        {pastSemesters.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.27 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="c-section-head" style={{ margin: 0 }}>
                <h2>Past Semesters</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/semesters')}>
                View all
              </Button>
            </div>
            <div className="c-acc">
              {pastSemesters.map((sem, i) => {
                const { gpa, credits } = semesterGPA(sem.id, allCourses, criteria, entries);
                const semCourses = allCourses.filter(c => c.semesterId === sem.id);
                const isOpen = openIds.has(sem.id);

                return (
                  <motion.div
                    key={sem.id}
                    custom={i}
                    variants={rowItem}
                    initial="hidden"
                    animate="show"
                  >
                    <div
                      className={`c-acc-row ${isOpen ? 'open' : ''}`}
                      onClick={() => toggleOpen(sem.id)}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-text)', letterSpacing: '-0.01em' }}>
                          {sem.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--c-text-3)', marginTop: 1 }}>{credits} credits</div>
                      </div>

                      <div className="c-bignum" style={{ fontSize: 24, textAlign: 'right' }}>
                        {fmtGPA(gpa)}
                      </div>

                      <IconChevronRight size={16} className="chev" />
                    </div>

                    <div className={`c-acc-panel ${isOpen ? 'open' : ''}`}>
                      <div className="inner">
                        <div className="c-acc-courses" style={{ borderTop: 'none' }}>
                          {semCourses.length === 0 ? (
                            <div style={{ padding: '14px 20px', color: 'var(--c-text-4)', fontSize: 13, background: 'var(--c-surface-2)' }}>
                              No courses
                            </div>
                          ) : (
                            semCourses.map(course => {
                              const cc = criteria.filter(cr => cr.courseId === course.id);
                              const ce = entries.filter(e => cc.some(cr => cr.id === e.criterionId));
                              const { pct } = courseRunningGrade(course, cc, ce);
                              const letter = pct !== null ? letterFor(pct) : '—';

                              return (
                                <div
                                  key={course.id}
                                  className="c-acc-course"
                                  onClick={e => { e.stopPropagation(); navigate(`/courses/${course.id}`); }}
                                  style={{ background: 'var(--c-surface-2)', borderTop: '1px solid var(--c-line)' }}
                                >
                                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text)', minWidth: 0 }} className="truncate">
                                    {displayCourseName(course, showShortNames)}
                                  </span>
                                  <span style={{ fontSize: 13, fontFamily: 'var(--f-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--c-text-3)' }}>
                                    {fmtPct(pct, 1)}
                                  </span>
                                  <GradePill letter={letter} size="sm" />
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
