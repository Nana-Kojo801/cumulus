import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Topbar } from '@/components/layout/Topbar';
import { useMenuOpen } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { GradePill } from '@/components/ui/GradePill';

import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useSemesters } from '@/hooks/useSemesters';
import { useCourses } from '@/hooks/useCourses';
import { useCriteria } from '@/hooks/useCriteria';
import { useScoreEntries } from '@/hooks/useScoreEntries';
import { cumulativeGPA, courseRunningGrade, letterFor, pointsFor } from '@/lib/calculations';
import { TARGET_GRADES, pointsForLetter } from '@/lib/gradeScale';
import { fmtGPA } from '@/lib/utils';
import { cn } from '@/lib/utils';

const RESET = '__current__';

export function Simulator() {
  const onMenuOpen = useMenuOpen();
  const semesters = useSemesters() ?? [];
  const courses = useCourses() ?? [];
  const criteria = useCriteria() ?? [];
  const entries = useScoreEntries() ?? [];

  const realGPA = cumulativeGPA(semesters, courses, criteria, entries);
  const [targetGPA, setTargetGPA] = useState(Math.min(4.0, (realGPA.gpa ?? 0) + 0.2));
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const sortedSemesters = useMemo(() =>
    [...semesters].sort((a, b) => a.year !== b.year ? a.year - b.year : a.term - b.term),
    [semesters]
  );

  const simGPA = useMemo(() => {
    let totalCredits = 0;
    let weightedPoints = 0;
    let counted = 0;

    for (const course of courses) {
      const override = overrides[course.id];
      let points: number;
      if (override) {
        points = pointsForLetter(override);
      } else {
        const courseCriteria = criteria.filter(cr => cr.courseId === course.id);
        const courseEntries = entries.filter(e => courseCriteria.some(cr => cr.id === e.criterionId));
        const { pct } = courseRunningGrade(course, courseCriteria, courseEntries);
        if (pct === null) continue;
        points = pointsFor(pct);
      }
      weightedPoints += points * course.credits;
      totalCredits += course.credits;
      counted++;
    }

    if (counted === 0) return null;
    return weightedPoints / totalCredits;
  }, [courses, criteria, entries, overrides]);

  const delta = (simGPA ?? 0) - (realGPA.gpa ?? 0);
  const targetDelta = targetGPA - (realGPA.gpa ?? 0);
  const achievable = (simGPA ?? 0) >= targetGPA - 0.001;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar breadcrumbs={[{ label: 'GPA Simulator' }]} onMenuOpen={onMenuOpen} />
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">

        {/* Target input */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <Card className="p-5 flex flex-col gap-4">
            <div className="text-[11px] uppercase tracking-[0.08em] text-(--c-text-3)">Target Cumulative GPA</div>
            <div className="flex items-center gap-5">
              <div
                className="tabular-nums font-semibold text-(--c-text)"
                style={{ fontSize: '52px', letterSpacing: '-0.028em', lineHeight: 1 }}
              >
                {fmtGPA(targetGPA)}
              </div>
              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max="4.00"
                  step="0.01"
                  value={targetGPA}
                  onChange={e => setTargetGPA(parseFloat(e.target.value))}
                  className="w-full h-1 cursor-pointer"
                  style={{ accentColor: 'var(--c-accent)' }}
                />
                <div className="flex justify-between text-[11px] text-(--c-text-4) mt-1">
                  <span>0.00</span><span>4.00</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[13px] text-(--c-text-2)">
              <span>Current: <strong className="text-(--c-text)">{fmtGPA(realGPA.gpa)}</strong></span>
              <span className={cn('font-semibold', targetDelta > 0 ? 'text-(--c-grade-c)' : 'text-(--c-grade-a)')}>
                {targetDelta > 0 ? '+' : ''}{targetDelta.toFixed(2)} needed
              </span>
            </div>
          </Card>
        </motion.div>

        {/* Simulated result */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.07 }}>
          <Card className={cn('p-5 flex flex-col gap-2', achievable ? 'border-(--c-grade-a)/30' : 'border-(--c-grade-e)/30')}>
            <div className="text-[11px] uppercase tracking-[0.08em] text-(--c-text-3)">Simulated Cumulative GPA</div>
            <motion.div
              key={String(simGPA?.toFixed(2))}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={cn('tabular-nums font-semibold', achievable ? 'text-(--c-grade-a)' : 'text-(--c-grade-e)')}
              style={{ fontSize: '40px', letterSpacing: '-0.028em' }}
            >
              {fmtGPA(simGPA)}
            </motion.div>
            <div className={cn('text-[13px]', achievable ? 'text-(--c-grade-a)' : 'text-(--c-text-3)')}>
              {simGPA === null
                ? 'No courses with grades yet.'
                : achievable
                ? `Target of ${fmtGPA(targetGPA)} is achievable with these grades.`
                : `Target of ${fmtGPA(targetGPA)} is not achievable with these grades.`}
            </div>
            {simGPA !== null && (
              <div className="text-[13px] text-(--c-text-3)">
                Delta from current:{' '}
                <span className={cn('font-semibold', delta >= 0 ? 'text-(--c-grade-a)' : 'text-(--c-grade-e)')}>
                  {delta >= 0 ? '+' : ''}{delta.toFixed(2)}
                </span>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Per-course overrides by semester */}
        {sortedSemesters.map((sem, si) => {
          const semCourses = courses.filter(c => c.semesterId === sem.id);
          if (semCourses.length === 0) return null;

          return (
            <motion.div
              key={sem.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.14 + si * 0.06 }}
            >
              <div className="text-[12px] text-(--c-text-3) mb-2 uppercase tracking-[0.06em]">
                {sem.name}
                {sem.status === 'active' && <span className="ml-2 text-(--c-accent)">Active</span>}
              </div>
              <Card className="divide-y divide-(--c-line) overflow-hidden">
                {semCourses.map(course => {
                  const courseCriteria = criteria.filter(cr => cr.courseId === course.id);
                  const courseEntries = entries.filter(e => courseCriteria.some(cr => cr.id === e.criterionId));
                  const { pct } = courseRunningGrade(course, courseCriteria, courseEntries);
                  const currentLetter = pct !== null ? letterFor(pct) : null;
                  const override = overrides[course.id];

                  return (
                    <div key={course.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="flex-1 text-[14px] text-(--c-text) truncate">{course.name}</span>
                      {currentLetter && !override && (
                        <GradePill letter={currentLetter} size="sm" />
                      )}
                      <Select
                        value={override ?? RESET}
                        onValueChange={val => {
                          setOverrides(prev => {
                            if (val === RESET) {
                              const { [course.id]: _, ...rest } = prev;
                              return rest;
                            }
                            return { ...prev, [course.id]: val };
                          });
                        }}
                      >
                        <SelectTrigger className="w-36 h-9 text-[13px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={RESET}>
                            {currentLetter ? `Current (${currentLetter})` : 'Current'}
                          </SelectItem>
                          <SelectSeparator />
                          {[...TARGET_GRADES, 'E'].map(g => (
                            <SelectItem key={g} value={g}>{g}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
