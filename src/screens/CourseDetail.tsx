import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IconPlus, IconEdit, IconTrash, IconTarget } from '@/components/icons';
import { Topbar } from '@/components/layout/Topbar';
import { useMenuOpen } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { GradePill } from '@/components/ui/GradePill';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Chip } from '@/components/ui/Chip';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CriterionModal } from '@/components/modals/CriterionModal';
import { CourseEditSheet } from '@/components/modals/CourseEditSheet';
import { ScoreEntryModal } from '@/components/modals/ScoreEntryModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { WhatScoreModal } from '@/components/modals/WhatScoreModal';
import { useCourse } from '@/hooks/useCourses';
import { useSemester } from '@/hooks/useSemesters';
import { useCriteriaByCourse } from '@/hooks/useCriteria';
import { useScoreEntries } from '@/hooks/useScoreEntries';
import { courseRunningGrade, criterionAverage, letterFor } from '@/lib/calculations';
import { bandFor, GRADE_SCALE } from '@/lib/gradeScale';
import { fmtPct, displayCourseName } from '@/lib/utils';
import { useDisplayPrefs } from '@/contexts/DisplayPrefsContext';
import { api } from '../../convex/_generated/api';
import { usePostHog } from '@posthog/react';
import type { Criterion, Course } from '@/db/schema';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { useOfflineMutation } from '@/lib/useOfflineMutation';

const BAND_BORDER: Record<string, string> = {
  a: 'var(--c-grade-a)',
  b: 'var(--c-grade-b)',
  c: 'var(--c-grade-c)',
  d: 'var(--c-grade-d)',
  e: 'var(--c-grade-e)',
};

export function CourseDetail() {
  const onMenuOpen = useMenuOpen();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const posthog = usePostHog();
  const { showShortNames } = useDisplayPrefs();
  const { toast } = useToast();

  const removeCriterion = useOfflineMutation(
    api.criteria.remove,
    'criteria/remove',
    (args) => args,
  );
  const updateCourse = useOfflineMutation(
    api.courses.update,
    'courses/update',
    (args) => args,
  );

  const course = useCourse(id);
  const semester = useSemester(course?.semesterId);
  const criteria = useCriteriaByCourse(id) ?? [];
  const allEntries = useScoreEntries() ?? [];
  const entries = allEntries.filter(e => criteria.some(cr => cr.id === e.criterionId));

  const [pendingCourseUpdates, setPendingCourseUpdates] = useState<Partial<Course>>({});
  
  useEffect(() => {
    setPendingCourseUpdates({});
  }, [course?.manualGradeEnabled, course?.manualGrade]);

  const effectiveCourse = course ? { ...course, ...pendingCourseUpdates } as Course : undefined;

  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showCriterionModal, setShowCriterionModal] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState<Criterion | undefined>();
  const [scoringCriterionId, setScoringCriterionId] = useState<string | null>(null);
  const [showWhatScore, setShowWhatScore] = useState(false);
  const [deleteCritId, setDeleteCritId] = useState<string | null>(null);

  const scoringCriterion = criteria.find(c => c.id === scoringCriterionId);
  const scoringCriterionRef = useRef<Criterion | undefined>(undefined);
  if (scoringCriterion) scoringCriterionRef.current = scoringCriterion;

  if (!effectiveCourse) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <Topbar title="" back="Semesters" onMenuOpen={onMenuOpen} />
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          <div className="skeleton" style={{ height: 28, width: '60%', borderRadius: 8 }} />
          <div className="skeleton" style={{ height: 72, width: '40%', borderRadius: 8 }} />
          <div className="skeleton rounded-[16px]" style={{ height: 120 }} />
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map(i => <div key={i} className="skeleton rounded-[12px]" style={{ height: 64 }} />)}
          </div>
        </div>
      </div>
    );
  }

  const { pct, weightCompleted } = courseRunningGrade(effectiveCourse, criteria, entries);
  const letter = pct !== null ? letterFor(pct) : null;
  const gradeBand = letter ? bandFor(letter) : null;

  const totalWeight = criteria.reduce((a, c) => a + c.weight, 0);
  const weightColor =
    totalWeight === 100
      ? 'text-(--c-accent)'
      : totalWeight > 100
      ? 'text-(--c-grade-e)'
      : 'text-(--c-grade-c)';

  const pendingWeight = 100 - weightCompleted;
  const bestCase = pct !== null
    ? Math.min(100, (pct * weightCompleted / 100) + pendingWeight)
    : pendingWeight;
  const worstCase = pct !== null ? (pct * weightCompleted / 100) : 0;

  const gradeTextColor = gradeBand
    ? { a: 'text-(--c-grade-a)', b: 'text-(--c-grade-b)', c: 'text-(--c-grade-c)', d: 'text-(--c-grade-d)', e: 'text-(--c-grade-e)' }[gradeBand]
    : 'text-(--c-text)';

  async function handleDeleteCriterion(critId: string) {
    await removeCriterion({ id: critId });
    posthog?.capture('criterion_deleted');
    toast('Criterion deleted');
  }

  const isLocked = !!effectiveCourse.manualGradeEnabled;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title={displayCourseName(effectiveCourse, showShortNames)}
        back={semester?.name ?? 'Semesters'}
        onMenuOpen={onMenuOpen}
        actions={
          <Button variant="ghost" size="sm" onClick={() => setShowEditSheet(true)}>
            <IconEdit size={14} /> Edit
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <h1 className="text-[22px] font-medium text-(--c-text)" style={{ letterSpacing: '-0.018em' }}>
                {displayCourseName(effectiveCourse, showShortNames)}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Chip>{effectiveCourse.credits} credits</Chip>
            {letter && <GradePill letter={letter} size="lg" />}
          </div>
          <div
            className={cn('tabular-nums font-semibold', gradeTextColor)}
            style={{ fontSize: '52px', letterSpacing: '-0.028em', lineHeight: 1 }}
          >
            {fmtPct(pct, 1)}
          </div>
          <div className="flex flex-col gap-1">
            <ProgressBar value={weightCompleted} />
            <span className="text-[12px] text-(--c-text-3)">{weightCompleted.toFixed(0)}% of grade scored</span>
          </div>
        </div>

        {!isLocked && criteria.length > 0 && (
          <Card className="p-4 flex flex-col gap-4">
            <h3 className="text-[14px] font-medium text-(--c-text)">Grade Forecast</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-(--c-grade-a)/8 border border-(--c-grade-a)/20 rounded-(--radius-r2) p-3">
                <div className="text-[10px] uppercase tracking-[0.08em] text-(--c-text-3) mb-1">Best case</div>
                <div className="text-[18px] font-semibold tabular-nums text-(--c-grade-a)">
                  {letterFor(bestCase)} · {bestCase.toFixed(1)}%
                </div>
              </div>
              <div className="bg-(--c-grade-e)/8 border border-(--c-grade-e)/20 rounded-(--radius-r2) p-3">
                <div className="text-[10px] uppercase tracking-[0.08em] text-(--c-text-3) mb-1">Worst case</div>
                <div className="text-[18px] font-semibold tabular-nums text-(--c-grade-e)">
                  {letterFor(worstCase)} · {worstCase.toFixed(1)}%
                </div>
              </div>
            </div>
            <Button
              variant="default"
              onClick={() => { posthog?.capture('gpa_forecast_viewed'); setShowWhatScore(true); }}
              className="self-start"
            >
              <IconTarget size={14} /> What score do I need?
            </Button>
          </Card>
        )}

        <Card className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="pr-4">
              <div className="text-[14px] font-medium text-(--c-text)">Override Final Grade</div>
              <div className="text-[12px] text-(--c-text-3)">Manually set the final course percentage, ignoring all criteria.</div>
            </div>
            <button 
              onClick={() => {
                const nextState = !effectiveCourse.manualGradeEnabled;
                setPendingCourseUpdates((prev: Partial<Course>) => ({ ...prev, manualGradeEnabled: nextState }));
                updateCourse({ id: effectiveCourse.id, manualGradeEnabled: nextState });
              }}
              className={cn(
                "w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer", 
                effectiveCourse.manualGradeEnabled ? "bg-(--c-accent)" : "bg-(--c-surface-3)"
              )}
            >
              <div className={cn(
                "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform",
                effectiveCourse.manualGradeEnabled ? "left-[22px]" : "left-[2px]"
              )} />
            </button>
          </div>
          {effectiveCourse.manualGradeEnabled && (
            <div className="pt-3 border-t border-(--c-line) flex flex-col gap-2">
              <div className="text-[12px] font-medium text-(--c-text)">Final Grade</div>
              <div className="max-w-[200px]">
                <Select
                  value={effectiveCourse.manualGrade?.toString() ?? ''}
                  onValueChange={(val) => {
                    const nextGrade = parseFloat(val);
                    setPendingCourseUpdates((prev: Partial<Course>) => ({ ...prev, manualGrade: nextGrade }));
                    updateCourse({ id: effectiveCourse.id, manualGrade: nextGrade });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a grade..." />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_SCALE.map(g => (
                      <SelectItem key={g.letter} value={g.min.toString()}>
                        {g.letter} ({g.points.toFixed(1)} pts)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-medium text-(--c-text)">Evaluation Criteria</h2>
            <Button variant="ghost" size="sm" disabled={isLocked} onClick={() => { setEditingCriterion(undefined); setShowCriterionModal(true); }}>
              <IconPlus size={13} /> Add Criterion
            </Button>
          </div>

          {criteria.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-(--c-text-3) text-[14px] mb-3">No criteria yet. Add evaluation components to track your grade.</p>
              <Button variant="primary" size="sm" onClick={() => { setEditingCriterion(undefined); setShowCriterionModal(true); }}>
                <IconPlus size={14} /> Add Criterion
              </Button>
            </Card>
          ) : (
            <Card className="divide-y divide-(--c-line) overflow-hidden">
              {criteria.map(crit => {
                const critEntries = entries.filter(e => e.criterionId === crit.id);
                const avg = criterionAverage(critEntries);
                const contribution = avg !== null ? avg * (crit.weight / 100) : null;
                const scored = critEntries.filter(e => e.score !== null).length;
                const avgLetter = avg !== null ? letterFor(avg) : null;
                const avgBand = avgLetter ? bandFor(avgLetter) : null;
                const borderColor = avgBand ? BAND_BORDER[avgBand] : undefined;

                return (
                  <div key={crit.id} style={borderColor ? { borderLeft: `3px solid ${borderColor}` } : {}}>
                    {/* Mobile layout */}
                    <div className="sm:hidden px-4 py-3.5 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[15px] text-(--c-text) font-medium truncate flex-1">{crit.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          {avgLetter && <GradePill letter={avgLetter} size="sm" />}
                          <Chip variant="default" className="text-[11px]">{crit.weight}%</Chip>
                        </div>
                      </div>
                      <ProgressBar value={avg ?? 0} />
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-(--c-text-3)">
                          {scored}/{critEntries.length} scored · avg {avg !== null ? `${avg.toFixed(1)}%` : '—'}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            className="p-1.5 rounded text-(--c-text-3) hover:text-(--c-text) hover:bg-(--c-surface-2) transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isLocked}
                            onClick={() => { setEditingCriterion(crit); setShowCriterionModal(true); }}
                          >
                            <IconEdit size={13} />
                          </button>
                          <button
                            className="p-1.5 rounded text-(--c-text-3) hover:text-(--c-grade-e) hover:bg-(--c-grade-e)/10 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isLocked}
                            onClick={() => setDeleteCritId(crit.id)}
                          >
                            <IconTrash size={13} />
                          </button>
                        </div>
                      </div>
                      <Button variant="primary" size="sm" className="w-full" disabled={isLocked} onClick={() => setScoringCriterionId(crit.id)}>
                        Score
                      </Button>
                    </div>

                    {/* Desktop layout */}
                    <div className="hidden sm:flex items-center gap-3 px-4 py-3.5">
                      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] text-(--c-text) font-medium">{crit.name}</span>
                          <Chip variant="default" className="text-[11px]">{crit.weight}%</Chip>
                          <span className="text-[12px] text-(--c-text-3)">{scored}/{critEntries.length} scored</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <ProgressBar value={avg ?? 0} className="w-24" />
                          <span className="text-[12px] font-mono tabular-nums text-(--c-text-3)">
                            avg {avg !== null ? `${avg.toFixed(1)}%` : '—'}
                          </span>
                          <span className="text-[12px] font-mono tabular-nums text-(--c-text-3)">
                            contributes {contribution !== null ? `${contribution.toFixed(1)}pts` : '—'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button variant="default" size="sm" disabled={isLocked} onClick={() => setScoringCriterionId(crit.id)}>Score</Button>
                        <button
                          className="p-1.5 rounded text-(--c-text-3) hover:text-(--c-text) hover:bg-(--c-surface-2) transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isLocked}
                          onClick={() => { setEditingCriterion(crit); setShowCriterionModal(true); }}
                        >
                          <IconEdit size={13} />
                        </button>
                        <button
                          className="p-1.5 rounded text-(--c-text-3) hover:text-(--c-grade-e) hover:bg-(--c-grade-e)/10 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isLocked}
                          onClick={() => setDeleteCritId(crit.id)}
                        >
                          <IconTrash size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </Card>
          )}

          <div className="flex items-center justify-between px-1">
            <span className="text-[12px] text-(--c-text-3)">Total weight</span>
            <span className={cn('text-[13px] font-mono font-semibold tabular-nums', weightColor)}>
              {totalWeight}%{totalWeight === 100 ? ' ✓' : ''}
            </span>
          </div>
        </div>
      </div>

      <CourseEditSheet
        open={showEditSheet}
        onClose={() => setShowEditSheet(false)}
        courseId={id}
      />

      <CriterionModal
        open={showCriterionModal}
        onClose={() => { setShowCriterionModal(false); setEditingCriterion(undefined); }}
        courseId={effectiveCourse.id}
        existingCriteria={criteria}
        editing={editingCriterion}
      />

      {scoringCriterionRef.current && (
        <ScoreEntryModal
          open={!!scoringCriterionId}
          onClose={() => setScoringCriterionId(null)}
          criterion={scoringCriterionRef.current}
          course={effectiveCourse}
          entries={entries.filter(e => e.criterionId === (scoringCriterionId ?? scoringCriterionRef.current?.id))}
        />
      )}

      <WhatScoreModal
        open={showWhatScore}
        onClose={() => setShowWhatScore(false)}
        course={effectiveCourse}
        criteria={criteria}
        entries={entries}
      />

      <ConfirmDialog
        open={deleteCritId !== null}
        onClose={() => setDeleteCritId(null)}
        onConfirm={() => deleteCritId && handleDeleteCriterion(deleteCritId)}
        title="Delete Criterion"
        description="This will permanently delete this criterion and all its score entries."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
