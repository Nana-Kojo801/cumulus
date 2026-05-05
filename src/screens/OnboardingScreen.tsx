import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import {
  IconExternalLink, IconLink, IconLoader, IconCheck,
  IconAlertTriangle, IconChevronDown, IconChevronRight,
} from '@/components/icons';
import { canvasApi, CanvasApiError } from '@/lib/canvas/client';
import { buildSyncPreview } from '@/lib/canvas/sync';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useUser } from '@clerk/clerk-react';
import { usePostHog } from '@posthog/react';
import { useToast } from '@/components/ui/Toast';
import { useCourses } from '@/hooks/useCourses';
import { cn, cleanCourseName } from '@/lib/utils';
import type { SyncPreview, SyncProgressEvent } from '@/lib/canvas/sync';
import type { CanvasConnection } from '@/db/schema';

type Phase = 'token' | 'fetching' | 'preview' | 'importing';

interface ProgressStep { step: string; label: string; done: boolean; }

export function OnboardingScreen() {
  const { user } = useUser();
  const posthog = usePostHog();
  const { toast } = useToast();
  const navigate = useNavigate();
  const courses = useCourses() ?? [];

  const upsertConnection = useMutation(api.canvasConnections.upsert);
  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const executeSyncMutation = useMutation(api.canvasSync.executeSync);

  const [phase, setPhase] = useState<Phase>('token');
  const [tokenInput, setTokenInput] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  const [savedConn, setSavedConn] = useState<CanvasConnection | null>(null);

  const [preview, setPreview] = useState<SyncPreview | null>(null);
  const [credits, setCredits] = useState<Record<number, number>>({});
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [expandedCourses, setExpandedCourses] = useState<Set<number>>(new Set());

  const firstName = user?.firstName ?? user?.fullName?.split(' ')[0] ?? 'there';

  const runFetch = useCallback(async (conn: CanvasConnection) => {
    setPhase('fetching');
    setProgressSteps([]);

    try {
      const result = await buildSyncPreview(
        conn,
        courses.map(c => ({ id: c.id, canvasId: c.canvasId })),
        (e: SyncProgressEvent) => {
          setProgressSteps(prev => {
            const steps = [...prev];
            const idx = steps.findIndex(s => s.step === e.step);
            const next = { step: e.step, label: e.message, done: e.done === e.total };
            if (idx >= 0) steps[idx] = next;
            else steps.push(next);
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
        setTokenError('Canvas token is invalid or expired. Please enter a new token.');
      } else if (err instanceof CanvasApiError) {
        setTokenError(`Canvas API error (${err.status}): ${err.message}`);
      } else {
        setTokenError('Failed to fetch from Canvas. Check your internet connection.');
      }
      setPhase('token');
    }
  }, [courses]);

  async function handleConnect() {
    if (!tokenInput.trim() || connecting) return;
    setConnecting(true);
    setTokenError(null);
    try {
      const canvasUser = await canvasApi.getUser(tokenInput.trim());
      const conn: CanvasConnection = {
        id: '',
        domain: 'ashesi.instructure.com',
        token: tokenInput.trim(),
        connectedAt: Date.now(),
        studentName: canvasUser.name,
        studentId: canvasUser.id,
      };
      await upsertConnection({
        domain: conn.domain,
        token: conn.token,
        connectedAt: conn.connectedAt,
        studentName: conn.studentName,
        studentId: conn.studentId,
      });
      setSavedConn(conn);
      posthog?.capture('canvas_connected', { student_name: conn.studentName });
      runFetch(conn);
    } catch (err) {
      if (err instanceof CanvasApiError && err.status === 401) {
        setTokenError('Invalid token — please double-check and try again');
      } else {
        setTokenError('Connection failed — check your internet connection');
      }
    } finally {
      setConnecting(false);
    }
  }

  async function handleConfirm() {
    if (!preview || !savedConn) return;
    setPhase('importing');
    try {
      await executeSyncMutation({
        semesters: preview.semesters,
        creditsByCanvasId: Object.entries(credits).map(([id, cr]) => ({ canvasId: +id, credits: cr })),
        selectedCanvasIds: Array.from(selected),
        connectionStudentName: savedConn.studentName,
        connectionStudentId: savedConn.studentId,
      });
      posthog?.capture('canvas_import_completed', {
        courses_imported: selected.size,
        semesters_count: preview.semesters.length,
      });
      await completeOnboarding({});
      navigate('/');
    } catch {
      toast('Import failed — please try again', 'error');
      setPhase('preview');
    }
  }

  async function handleSkip() {
    posthog?.capture('onboarding_skipped');
    await completeOnboarding({});
    navigate('/');
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
    setSelected(allSelected ? new Set() : new Set(allCourseIds));
  }

  // ── Token phase ──────────────────────────────────────────────────────────
  if (phase === 'token') {
    return (
      <div className="min-h-screen bg-(--c-bg) flex items-center justify-center p-5">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="w-full max-w-[440px] flex flex-col gap-6"
        >
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-(--c-accent) flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-(--c-bg)">1</span>
            </div>
            <div className="text-[12px] text-(--c-text-3)">Canvas Setup</div>
            <div className="flex-1 h-px bg-(--c-line)" />
            <div className="text-[12px] text-(--c-text-4)">Optional</div>
          </div>

          <div>
            <h1
              className="text-[26px] font-bold text-(--c-text)"
              style={{ letterSpacing: '-0.022em', lineHeight: 1.2 }}
            >
              Hey, {firstName}! 👋
            </h1>
            <p className="text-[14px] text-(--c-text-3) mt-2 leading-relaxed">
              Connect Canvas LMS to automatically import your courses and grades.
              You can always do this later from{' '}
              <span className="text-(--c-text-2)">Settings</span>.
            </p>
          </div>

          {tokenError && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-(--radius-r2) bg-(--c-grade-e)/10 border border-(--c-grade-e)/25 text-[13px] text-(--c-grade-e)">
              <IconAlertTriangle size={14} className="shrink-0" />
              {tokenError}
            </div>
          )}

          <div
            className="rounded-(--radius-r4) overflow-hidden"
            style={{ border: '1px solid var(--c-line-2)', background: 'var(--c-surface)' }}
          >
            <div className="p-5 flex flex-col gap-3">
              <label className="text-[11px] font-semibold text-(--c-text-3) uppercase tracking-[0.08em]">
                Canvas Access Token
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  className="flex-1 min-w-0 h-10 px-3 text-[14px] bg-(--c-bg-2) border border-(--c-line) rounded-(--radius-r2) text-(--c-text) outline-none focus:border-(--c-accent) placeholder:text-(--c-text-4) transition-colors"
                  placeholder="Paste your token here…"
                  value={tokenInput}
                  onChange={e => setTokenInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleConnect()}
                  autoFocus
                />
                <Button
                  variant="primary"
                  onClick={handleConnect}
                  disabled={connecting || !tokenInput.trim()}
                >
                  {connecting
                    ? <IconLoader size={14} className="animate-spin" />
                    : <IconLink size={14} />}
                  {connecting ? 'Checking…' : 'Connect'}
                </Button>
              </div>
            </div>

            <div className="h-px bg-(--c-line)" />

            <div className="p-5 flex flex-col gap-3 bg-(--c-surface-2)">
              <div className="text-[12px] font-semibold text-(--c-text-2)">
                How to get your Canvas access token
              </div>
              <ol className="flex flex-col gap-2">
                {[
                  <>Open Canvas and go to <strong className="text-(--c-text-2) font-medium">Account → Settings</strong></>,
                  <>Scroll to <strong className="text-(--c-text-2) font-medium">Approved Integrations</strong></>,
                  <>Click <strong className="text-(--c-text-2) font-medium">+ New Access Token</strong>, give it a name, and copy it</>,
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-px"
                      style={{ background: 'var(--c-surface-3)', fontSize: '10px', color: 'var(--c-text-3)' }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-[12px] text-(--c-text-3) leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
              <a
                href="https://ashesi.instructure.com/profile/settings"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[12px] text-(--c-accent) hover:underline w-fit"
              >
                <IconExternalLink size={11} /> Open Canvas Settings
              </a>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-[13px] text-(--c-text-3) hover:text-(--c-text-2) transition-colors cursor-pointer"
            >
              Skip for now
            </button>
            <span className="text-[12px] text-(--c-text-4)">
              Connect anytime in Settings →
            </span>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Fetching phase ───────────────────────────────────────────────────────
  if (phase === 'fetching') {
    return (
      <div className="min-h-screen bg-(--c-bg) flex items-center justify-center p-5">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-[440px] flex flex-col gap-6"
        >
          <div>
            <h2 className="text-[20px] font-semibold text-(--c-text)" style={{ letterSpacing: '-0.018em' }}>
              Fetching from Canvas
            </h2>
            <p className="text-[13px] text-(--c-text-3) mt-1">
              Importing your courses and grades…
            </p>
          </div>
          <Card className="p-5 flex flex-col gap-3">
            {progressSteps.length === 0 ? (
              <div className="flex items-center gap-2 text-[13px] text-(--c-text-3)">
                <IconLoader size={14} className="text-(--c-accent) animate-spin shrink-0" />
                Connecting to Canvas…
              </div>
            ) : progressSteps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-[13px]"
              >
                {s.done
                  ? <IconCheck size={14} className="text-(--c-grade-a) shrink-0" />
                  : <IconLoader size={14} className="text-(--c-accent) shrink-0 animate-spin" />
                }
                <span className={s.done ? 'text-(--c-text-3)' : 'text-(--c-text-2)'}>{s.label}</span>
              </motion.div>
            ))}
          </Card>
        </motion.div>
      </div>
    );
  }

  // ── Importing phase ──────────────────────────────────────────────────────
  if (phase === 'importing') {
    return (
      <div className="min-h-screen bg-(--c-bg) flex items-center justify-center p-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <IconLoader size={32} className="text-(--c-accent) animate-spin" />
          <div className="text-[15px] text-(--c-text-2)">Saving to Cumulus…</div>
        </motion.div>
      </div>
    );
  }

  // ── Preview phase ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-(--c-bg) flex flex-col">
      <div className="shrink-0 px-5 pt-6 pb-4 border-b border-(--c-line) bg-(--c-bg-2)">
        <div className="max-w-[640px] mx-auto flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[18px] font-semibold text-(--c-text)" style={{ letterSpacing: '-0.018em' }}>
              Review your courses
            </h2>
            <p className="text-[13px] text-(--c-text-3) mt-0.5">
              Select what to import — you can always sync again from Settings
            </p>
          </div>
          <button
            onClick={toggleAll}
            className="text-[13px] text-(--c-accent) hover:underline cursor-pointer shrink-0"
          >
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[640px] mx-auto px-5 py-5 flex flex-col gap-5 pb-28">

          {preview && (
            <Card className="p-4 bg-gradient-to-br from-(--c-surface) to-(--c-accent-bg)/30">
              <div className="text-[14px] font-medium text-(--c-text)">Preview ready</div>
              <div className="text-[13px] text-(--c-text-3) mt-0.5">
                {preview.totalCourses} {preview.totalCourses === 1 ? 'course' : 'courses'} across{' '}
                {preview.semesters.length} {preview.semesters.length === 1 ? 'semester' : 'semesters'} ·{' '}
                {preview.totalAssignments} assignments
              </div>
            </Card>
          )}

          {preview && preview.warnings.length > 0 && (
            <Card className="p-4 border-(--c-grade-c)/30 bg-(--c-grade-c)/8 flex items-start gap-3">
              <IconAlertTriangle size={16} className="text-(--c-grade-c) shrink-0 mt-0.5" />
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
          )}

          {preview?.semesters.map((sem, si) => (
            <motion.div
              key={sem.termId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.04 }}
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
                      <div className={cn('flex items-center gap-3 px-4 py-3.5 transition-colors', !isSelected && 'opacity-50')}>
                        <button
                          onClick={() => toggleCourse(course.canvasId)}
                          className={cn(
                            'w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition-all cursor-pointer',
                            isSelected ? 'bg-(--c-accent) border-(--c-accent)' : 'bg-(--c-surface-2) border-(--c-line-2)'
                          )}
                        >
                          {isSelected && <IconCheck size={12} className="text-white" strokeWidth={3} />}
                        </button>

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

                        <button
                          onClick={() => toggleExpand(course.canvasId)}
                          className="p-1 text-(--c-text-4) hover:text-(--c-text) transition-colors cursor-pointer shrink-0"
                        >
                          {isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                        </button>
                      </div>

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
        </div>
      </div>

      <div
        className="fixed bottom-0 inset-x-0 px-5 py-4 border-t border-(--c-line) bg-(--c-bg-2)/95 backdrop-blur-sm"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-[640px] mx-auto flex items-center justify-between gap-3">
          <button
            onClick={handleSkip}
            className="text-[13px] text-(--c-text-3) hover:text-(--c-text-2) transition-colors cursor-pointer"
          >
            Skip import
          </button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={selected.size === 0}
          >
            Import {selected.size} {selected.size === 1 ? 'course' : 'courses'}
          </Button>
        </div>
      </div>
    </div>
  );
}
