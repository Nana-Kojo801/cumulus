import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
<<<<<<< HEAD
import { IconCheck, IconChevronDown, IconChevronRight, IconAlertTriangle, IconLoader } from '@/components/icons';
=======
import { IconCheck, IconChevronDown, IconChevronRight, IconWarning, IconLoader } from '@/components/icons';
>>>>>>> f015a05a7e316a7e27334f0db0dad84b1bacc6e6
import { motion, AnimatePresence } from 'framer-motion';
import { Topbar } from '@/components/layout/Topbar';
import { useMenuOpen } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { useCanvasConnection } from '@/hooks/useCanvasConnection';
import { useCourses } from '@/hooks/useCourses';
import { buildSyncPreview } from '@/lib/canvas/sync';
import { CanvasApiError } from '@/lib/canvas/client';
import { useToast } from '@/components/ui/Toast';
import { cn, cleanCourseName } from '@/lib/utils';
import type { SyncPreview, SyncProgressEvent } from '@/lib/canvas/sync';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

type Phase = 'idle' | 'fetching' | 'preview' | 'importing' | 'done';

interface ProgressStep {
  label: string;
  done: boolean;
}

export function CanvasSyncPreview() {
  const onMenuOpen = useMenuOpen();
  const navigate = useNavigate();
  const { toast } = useToast();
  const connection = useCanvasConnection();
  const courses = useCourses() ?? [];
  const executeSyncMutation = useMutation(api.canvasSync.executeSync);
  const updateLastSynced = useMutation(api.canvasConnections.updateLastSynced);

  const [phase, setPhase] = useState<Phase>('idle');
  const [preview, setPreview] = useState<SyncPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);

  const [credits, setCredits] = useState<Record<number, number>>({});
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [expandedCourses, setExpandedCourses] = useState<Set<number>>(new Set());

  const runFetch = useCallback(async () => {
    if (!connection) return;
    setPhase('fetching');
    setError(null);
    setProgressSteps([]);

    try {
      const result = await buildSyncPreview(
        connection,
        courses.map(c => ({ id: c.id, canvasId: c.canvasId })),
        (e: SyncProgressEvent) => {
          setProgressSteps(prev => {
            const steps = [...prev];
            const existing = steps.findIndex(s => s.label.startsWith(e.step));
            const newStep = { label: e.message, done: e.done === e.total };
            if (existing >= 0) {
              steps[existing] = newStep;
            } else {
              steps.push(newStep);
            }
            return steps;
          });
        }
      );

      const defaultCredits: Record<number, number> = {};
      const defaultSelected = new Set<number>();
      for (const sem of result.semesters) {
        for (const course of sem.courses) {
          defaultCredits[course.canvasId] = 3;
          defaultSelected.add(course.canvasId);
        }
      }
      setCredits(defaultCredits);
      setSelected(defaultSelected);
      setPreview(result);
      setPhase('preview');
    } catch (err) {
      if (err instanceof CanvasApiError && err.status === 401) {
        setError('Your Canvas token is invalid or has expired. Go back to Settings and reconnect.');
      } else if (err instanceof CanvasApiError) {
        setError(`Canvas API error (${err.status}): ${err.message}`);
      } else {
        setError('An unexpected error occurred. Check your connection and try again.');
      }
      setPhase('idle');
    }
  }, [connection, courses]);

  async function handleConfirm() {
    if (!preview || !connection) return;
    setPhase('importing');
    try {
      await executeSyncMutation({
        semesters: preview.semesters,
        creditsByCanvasId: Object.entries(credits).map(([id, cr]) => ({ canvasId: +id, credits: cr })),
        selectedCanvasIds: Array.from(selected),
        connectionStudentName: connection.studentName,
        connectionStudentId: connection.studentId,
      });
      await updateLastSynced({ lastSyncedAt: Date.now() });
      setPhase('done');
      toast('Canvas sync complete');
    } catch {
      toast('Import failed — please try again', 'error');
      setPhase('preview');
    }
  }

  function toggleCourse(canvasId: number) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(canvasId)) next.delete(canvasId);
      else next.add(canvasId);
      return next;
    });
  }

  function toggleExpand(canvasId: number) {
    setExpandedCourses(prev => {
      const next = new Set(prev);
      if (next.has(canvasId)) next.delete(canvasId);
      else next.add(canvasId);
      return next;
    });
  }

  const allCourseIds = preview?.semesters.flatMap(s => s.courses.map(c => c.canvasId)) ?? [];
  const allSelected = allCourseIds.length > 0 && allCourseIds.every(id => selected.has(id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allCourseIds));
    }
  }

  if (phase === 'done') {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <Topbar title="Canvas Sync" back="Settings" onMenuOpen={onMenuOpen} />
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.4 }}
            className="w-16 h-16 rounded-full bg-(--c-grade-a)/20 border border-(--c-grade-a)/30 flex items-center justify-center"
          >
            <IconCheck size={28} className="text-(--c-grade-a)" />
          </motion.div>
          <div className="text-center">
            <div className="text-[18px] font-medium text-(--c-text) mb-1">Sync complete</div>
            <div className="text-[14px] text-(--c-text-3)">Your Canvas grades have been imported into Cumulus.</div>
          </div>
          <Button variant="primary" onClick={() => navigate('/')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Canvas Sync" back="Settings" onMenuOpen={onMenuOpen} />

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">

        {/* Error */}
        {error && (
          <Card className="p-4 border-(--c-grade-e)/30 bg-(--c-grade-e)/8 flex items-start gap-3">
<<<<<<< HEAD
            <IconAlertTriangle size={16} className="text-(--c-grade-e) shrink-0 mt-0.5" />
=======
            <IconWarning size={16} className="text-(--c-grade-e) shrink-0 mt-0.5" />
>>>>>>> f015a05a7e316a7e27334f0db0dad84b1bacc6e6
            <div className="flex-1">
              <div className="text-[13px] text-(--c-grade-e) font-medium mb-1">Sync failed</div>
              <div className="text-[13px] text-(--c-text-3)">{error}</div>
            </div>
          </Card>
        )}

        {/* Idle / loading */}
        {(phase === 'idle' || phase === 'fetching') && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6 flex flex-col gap-5">
              <div>
                <div className="text-[16px] font-medium text-(--c-text) mb-1">Sync from Canvas</div>
                <div className="text-[13px] text-(--c-text-3)">
                  Cumulus will fetch your courses, assignment groups, and submission scores from Canvas LMS.
                  You'll get a chance to review everything before any data is saved.
                </div>
              </div>

              {phase === 'fetching' && (
                <div className="flex flex-col gap-2">
                  {progressSteps.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 text-[13px]"
                    >
                      {step.done
                        ? <IconCheck size={14} className="text-(--c-grade-a) shrink-0" />
                        : <IconLoader size={14} className="text-(--c-accent) shrink-0 animate-spin" />
                      }
                      <span className={step.done ? 'text-(--c-text-3)' : 'text-(--c-text-2)'}>
                        {step.label}
                      </span>
                    </motion.div>
                  ))}
                  {progressSteps.length === 0 && (
                    <div className="flex items-center gap-2 text-[13px] text-(--c-text-3)">
                      <IconLoader size={14} className="text-(--c-accent) animate-spin" />
                      Connecting to Canvas…
                    </div>
                  )}
                </div>
              )}

              {phase === 'idle' && (
                <div className="flex gap-2">
                  <Button variant="primary" onClick={runFetch} disabled={!connection}>
                    {connection ? 'Fetch from Canvas' : 'No Canvas account connected'}
                  </Button>
                  <Button variant="ghost" onClick={() => navigate('/settings')}>Cancel</Button>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Preview */}
        {phase === 'preview' && preview && (
          <>
            {/* Summary */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-4 bg-gradient-to-br from-(--c-surface) to-(--c-accent-bg)/30 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-[15px] font-medium text-(--c-text)">Preview ready</div>
                  <div className="text-[13px] text-(--c-text-3)">
                    {preview.totalCourses} {preview.totalCourses === 1 ? 'course' : 'courses'} across{' '}
                    {preview.semesters.length} {preview.semesters.length === 1 ? 'semester' : 'semesters'} ·{' '}
                    {preview.totalAssignments} assignments
                  </div>
                </div>
                <button
                  onClick={toggleAll}
                  className="text-[13px] text-(--c-accent) hover:underline cursor-pointer"
                >
                  {allSelected ? 'Deselect all' : 'Select all'}
                </button>
              </Card>
            </motion.div>

            {/* Warnings */}
            {preview.warnings.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <Card className="p-4 border-(--c-grade-c)/30 bg-(--c-grade-c)/8 flex items-start gap-3">
<<<<<<< HEAD
                  <IconAlertTriangle size={16} className="text-(--c-grade-c) shrink-0 mt-0.5" />
=======
                  <IconWarning size={16} className="text-(--c-grade-c) shrink-0 mt-0.5" />
>>>>>>> f015a05a7e316a7e27334f0db0dad84b1bacc6e6
                  <div>
                    <div className="text-[13px] font-medium text-(--c-grade-c) mb-1">
                      {preview.warnings.length === 1
                        ? '1 course has unweighted grading'
                        : `${preview.warnings.length} courses have unweighted grading`}
                    </div>
                    <div className="text-[13px] text-(--c-text-3) mb-2">
                      These courses don't use weighted assignment groups in Canvas. Criteria weights will be 0% after import — you'll need to set them manually.
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {preview.warnings.map(w => (
                        <Chip key={w.courseName} variant="default" className="text-[11px]">{w.courseName}</Chip>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Semesters + courses */}
            {preview.semesters.map((sem, si) => (
              <motion.div
                key={sem.termId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.07 + si * 0.04 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[12px] uppercase tracking-[0.07em] text-(--c-text-3) font-medium">
                    {sem.name}
                  </span>
                  {sem.status === 'active' && (
                    <Chip variant="accent" className="text-[10px]">Active</Chip>
                  )}
                </div>

                <Card className="divide-y divide-(--c-line) overflow-hidden">
                  {sem.courses.map(course => {
                    const isSelected = selected.has(course.canvasId);
                    const isExpanded = expandedCourses.has(course.canvasId);
                    const totalAssignments = course.criteria.reduce((n, c) => n + c.assignments.length, 0);
                    const scoredAssignments = course.criteria.reduce((n, c) => n + c.scoredCount, 0);

                    return (
                      <div key={course.canvasId}>
                        <div className={cn(
                          'flex items-center gap-3 px-4 py-3.5 transition-colors',
                          !isSelected && 'opacity-50'
                        )}>
                          {/* Checkbox */}
                          <button
                            onClick={() => toggleCourse(course.canvasId)}
                            className={cn(
                              'w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition-all cursor-pointer',
                              isSelected
                                ? 'bg-(--c-accent) border-(--c-accent)'
                                : 'bg-(--c-surface-2) border-(--c-line-2)'
                            )}
                          >
                            {isSelected && <IconCheck size={12} className="text-white" strokeWidth={3} />}
                          </button>

                          {/* Course info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[14px] font-medium text-(--c-text) truncate">{cleanCourseName(course.name)}</span>
                              {course.code && (
                                <span className="text-[11px] font-mono text-(--c-text-3) bg-(--c-surface-2) px-1.5 py-0.5 rounded shrink-0">
                                  {course.code}
                                </span>
                              )}
                              {!course.isWeighted && (
                                <Chip variant="default" className="text-[10px] shrink-0">⚠ unweighted</Chip>
                              )}
                              {course.existingCumulusId && (
                                <Chip variant="accent" className="text-[10px] shrink-0">update</Chip>
                              )}
                            </div>
                            <div className="text-[12px] text-(--c-text-3) mt-0.5">
                              {course.criteria.length} criteria · {scoredAssignments}/{totalAssignments} scored
                            </div>
                          </div>

                          {/* Credits input */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <input
                              type="number"
                              min="1"
                              max="9"
                              className="w-12 bg-(--c-bg-2) border border-(--c-line) rounded-(--radius-r1) px-2 py-1 text-[13px] font-mono text-center text-(--c-text) outline-none focus:border-(--c-accent)"
                              value={credits[course.canvasId] ?? 3}
                              onChange={e => setCredits(prev => ({
                                ...prev,
                                [course.canvasId]: Math.max(1, parseInt(e.target.value) || 1),
                              }))}
                              disabled={!isSelected}
                            />
                            <span className="text-[11px] text-(--c-text-4)">cr</span>
                          </div>

                          {/* Expand toggle */}
                          <button
                            onClick={() => toggleExpand(course.canvasId)}
                            className="p-1 text-(--c-text-4) hover:text-(--c-text) transition-colors cursor-pointer shrink-0"
                          >
                            {isExpanded
                              ? <IconChevronDown size={14} />
                              : <IconChevronRight size={14} />}
                          </button>
                        </div>

                        {/* Expandable criteria list */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.18, ease: 'easeOut' as const }}
                              className="overflow-hidden border-t border-(--c-line)"
                            >
                              <div className="bg-(--c-surface-2) px-4 py-3 flex flex-col gap-2">
                                {course.criteria.length === 0 ? (
                                  <span className="text-[12px] text-(--c-text-4)">No published assignment groups found.</span>
                                ) : course.criteria.map(crit => (
                                  <div key={crit.canvasGroupId} className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="text-[13px] text-(--c-text-2) truncate">{crit.name}</span>
                                      <Chip variant="default" className="text-[10px] shrink-0">
                                        {crit.weight > 0 ? `${crit.weight}%` : 'no weight'}
                                      </Chip>
                                    </div>
                                    <span className="text-[12px] text-(--c-text-4) tabular-nums shrink-0">
                                      {crit.scoredCount}/{crit.assignments.length}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </Card>
              </motion.div>
            ))}

            {/* Action bar */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex justify-between gap-3 pb-4"
            >
              <Button variant="ghost" onClick={() => navigate('/settings')}>Cancel</Button>
              <Button
                variant="primary"
                onClick={handleConfirm}
                disabled={selected.size === 0}
              >
                Confirm import ({selected.size} {selected.size === 1 ? 'course' : 'courses'})
              </Button>
            </motion.div>
          </>
        )}

        {/* Importing */}
        {phase === 'importing' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 gap-4">
            <IconLoader size={32} className="text-(--c-accent) animate-spin" />
            <div className="text-[15px] text-(--c-text-2)">Saving to Cumulus…</div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
