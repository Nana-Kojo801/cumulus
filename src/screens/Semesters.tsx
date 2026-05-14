import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconPlus, IconTrash, IconChevronRight, IconEdit } from '@/components/icons';
import { motion } from 'framer-motion';
import { Topbar } from '@/components/layout/Topbar';
import { useMenuOpen } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { GradePill } from '@/components/ui/GradePill';
import { CourseEditSheet } from '@/components/modals/CourseEditSheet';
import { useSemesters } from '@/hooks/useSemesters';
import { useCourses } from '@/hooks/useCourses';
import { useCriteria } from '@/hooks/useCriteria';
import { useScoreEntries } from '@/hooks/useScoreEntries';
import { cumulativeGPA, semesterGPA, courseRunningGrade, letterFor } from '@/lib/calculations';
import { fmtGPA, fmtPct, displayCourseName } from '@/lib/utils';
import { useDisplayPrefs } from '@/contexts/DisplayPrefsContext';
import { api } from '../../convex/_generated/api';
import { useToast } from '@/components/ui/Toast';
import type { Semester } from '@/db/schema';
import { useOfflineMutation } from '@/lib/useOfflineMutation';


interface SemesterSheetProps {
  open: boolean;
  onClose: () => void;
  existing?: Semester;
}

function SemesterSheet({ open, onClose, existing }: SemesterSheetProps) {
  const { toast } = useToast();
  const semesters = useSemesters() ?? [];
  const createSemester = useOfflineMutation(
    api.semesters.create,
    'semesters/create',
    (args) => ({ ...args, tempId: crypto.randomUUID() }),
    (localArgs) => (localArgs as { tempId: string }).tempId,
  );
  const updateSemester = useOfflineMutation(
    api.semesters.update,
    'semesters/update',
    (args) => args,
  );
  const isNew = !existing;

  const [name, setName] = useState('');
  const [status, setStatus] = useState<'complete' | 'active'>('active');

  useEffect(() => {
    if (open) {
      if (existing) {
        setName(existing.name);
        setStatus(existing.status);
      } else {
        setName('');
        setStatus('active');
      }
    }
  }, [open, existing]);

  async function handleSave() {
    if (!name.trim()) return;
    if (isNew) {
      await createSemester({ name: name.trim(), status, createdAt: Date.now() });
      toast('Semester created');
    } else {
      await updateSemester({ id: existing!.id, name: name.trim(), status });
      toast('Semester updated');
    }
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title={isNew ? 'New Semester' : 'Edit Semester'} fullHeight>
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto p-5 flex flex-col gap-5">

          <div className="flex flex-col gap-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Year 1 · Semester 1" autoFocus={open} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Status</Label>
            <div className="flex gap-2">
              {(['active', 'complete'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className="flex-1 h-9 rounded-xl text-[13px] font-semibold border transition-all cursor-pointer"
                  style={{
                    background: status === s ? 'var(--c-accent-bg)' : 'var(--c-surface-2)',
                    color: status === s ? 'var(--c-accent)' : 'var(--c-text-2)',
                    borderColor: status === s ? 'var(--c-accent)' : 'var(--c-line)',
                  }}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            {status === 'active' && isNew && semesters.some(s => s.status === 'active') && (
              <p className="text-[12px]" style={{ color: 'var(--c-warn)' }}>
                The current active semester will be marked complete.
              </p>
            )}
          </div>

        </div>
        <div className="shrink-0 border-t border-(--c-line) flex justify-end gap-2 px-5 py-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={!name.trim()}>
            {isNew ? 'Create Semester' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

function SemestersSkeleton({ onMenuOpen }: { onMenuOpen: () => void }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Semesters" onMenuOpen={onMenuOpen} actions={<div className="skeleton w-28 h-8 rounded-full" />} />
      <div className="flex-1 overflow-y-auto p-5 lg:p-7 flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="skeleton rounded-[16px]" style={{ height: 80 }} />
          <div className="skeleton rounded-[16px]" style={{ height: 80 }} />
        </div>
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map(i => <div key={i} className="skeleton rounded-[14px]" style={{ height: 64 }} />)}
        </div>
      </div>
    </div>
  );
}

export function Semesters() {
  const onMenuOpen = useMenuOpen();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { showShortNames } = useDisplayPrefs();
  const [showNew, setShowNew] = useState(false);
  const [editingSem, setEditingSem] = useState<Semester | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [autoOpened, setAutoOpened] = useState(false);
  const [addCourseSemId, setAddCourseSemId] = useState<string | null>(null);

  const removeSemester = useOfflineMutation(
    api.semesters.remove,
    'semesters/remove',
    (args) => args,
  );
  const rawSemesters = useSemesters();
  const courses = useCourses() ?? [];
  const criteria = useCriteria() ?? [];
  const entries = useScoreEntries() ?? [];

  useEffect(() => {
    if (!rawSemesters || autoOpened || rawSemesters.length === 0) return;
    const active = rawSemesters.find(s => s.status === 'active');
    if (active) setOpenIds(new Set([active.id]));
    setAutoOpened(true);
  }, [rawSemesters, autoOpened]);

  if (rawSemesters === undefined) return <SemestersSkeleton onMenuOpen={onMenuOpen} />;

  const semesters = rawSemesters;
  const cumulative = cumulativeGPA(semesters, courses, criteria, entries);

  async function handleDelete(semId: string) {
    await removeSemester({ id: semId });
    toast('Semester deleted');
  }

  function toggleOpen(id: string) {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const sorted = [...semesters].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="Semesters"
        onMenuOpen={onMenuOpen}
        actions={
          <Button variant="primary" size="sm" onClick={() => setShowNew(true)}>
            <IconPlus size={14} /> New Semester
          </Button>
        }
      />
      <div className="flex-1 overflow-y-auto p-5 lg:p-7 flex flex-col gap-6">

        {/* Summary stats */}
        <motion.div
          className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="c-card p-4">
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-text-4)', fontWeight: 700, marginBottom: 6 }}>
              Cumulative GPA
            </div>
            <div className="c-bignum" style={{ fontSize: 32 }}>{fmtGPA(cumulative.gpa)}</div>
          </div>
          <div className="c-card p-4">
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-text-4)', fontWeight: 700, marginBottom: 6 }}>
              Total Credits
            </div>
            <div className="c-bignum" style={{ fontSize: 32 }}>{cumulative.credits}</div>
          </div>
        </motion.div>

        {sorted.length === 0 ? (
          <div
            style={{
              padding: '60px 24px',
              border: '1.5px dashed var(--c-line-2)',
              borderRadius: 'var(--r-4)',
              textAlign: 'center',
              color: 'var(--c-text-3)',
            }}
          >
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 26, color: 'var(--c-text-2)', marginBottom: 8 }}>
              No semesters yet
            </div>
            <p style={{ fontSize: 13, marginBottom: 18 }}>Create your first semester to begin tracking.</p>
            <Button variant="primary" size="sm" onClick={() => setShowNew(true)}>
              <IconPlus size={14} /> New Semester
            </Button>
          </div>
        ) : (
          <motion.div
            className="c-acc"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.06 }}
          >
            {sorted.map((sem) => {
              const { gpa, credits } = semesterGPA(sem.id, courses, criteria, entries);
              const semCourses = courses.filter(c => c.semesterId === sem.id);
              const isOpen = openIds.has(sem.id);
              const isActive = sem.status === 'active';

              return (
                <div key={sem.id}>
                  {/* Accordion header row */}
                  <div
                    className={`c-acc-row ${isOpen ? 'open' : ''}`}
                    style={isActive ? { borderLeft: '3px solid var(--c-accent)', paddingLeft: 17 } : {}}
                    onClick={() => toggleOpen(sem.id)}
                  >
                    {/* Name */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-text)', letterSpacing: '-0.01em' }}>
                        {sem.name}
                      </div>
                    </div>

                    {/* GPA — hidden on mobile */}
                    <div className="c-bignum hidden sm:block" style={{ fontSize: 24, textAlign: 'right' }}>
                      {fmtGPA(gpa)}
                    </div>

                    {/* Chevron */}
                    <IconChevronRight size={16} className="chev" />
                  </div>

                  {/* Accordion panel */}
                  <div className={`c-acc-panel ${isOpen ? 'open' : ''}`}>
                    <div className="inner">
                      {/* Info + actions bar */}
                      <div
                        className="flex items-center gap-2 px-5 py-3"
                        style={{ borderBottom: '1px solid var(--c-line)', background: 'var(--c-surface-2)' }}
                      >
                        <div className="flex-1 flex items-center gap-2 flex-wrap" style={{ fontSize: 13, color: 'var(--c-text-3)' }}>
                          <span>{semCourses.length} courses</span>
                          <span>·</span>
                          <span>{credits} credits</span>
                          {isActive && <span style={{ color: 'var(--c-accent)', fontWeight: 600 }}>· Active</span>}
                        </div>
                        {/* Desktop: labeled buttons */}
                        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                          <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); setEditingSem(sem); }}>
                            <IconEdit size={13} /> Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); setAddCourseSemId(sem.id); }}>
                            <IconPlus size={13} /> Add Course
                          </Button>
                          <Button variant="ghost" size="sm" className="text-(--c-grade-e) hover:bg-(--c-grade-e)/10" onClick={e => { e.stopPropagation(); setDeleteId(sem.id); }}>
                            <IconTrash size={13} /> Delete
                          </Button>
                        </div>
                      </div>
                      {/* Courses list */}
                      <div className="c-acc-courses">
                        {semCourses.length === 0 ? (
                          <div style={{ padding: '14px 20px', color: 'var(--c-text-4)', fontSize: 13 }}>
                            No courses yet — tap + to add one
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
                      {/* Mobile: labeled buttons below the courses list */}
                      <div
                        className="flex sm:hidden items-center gap-2 px-4 py-3"
                        style={{ borderTop: '1px solid var(--c-line)', background: 'var(--c-surface-2)' }}
                        onClick={e => e.stopPropagation()}
                      >
                        <Button variant="ghost" size="sm" className="flex-1" onClick={e => { e.stopPropagation(); setEditingSem(sem); }}>
                          <IconEdit size={13} /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="flex-1" onClick={e => { e.stopPropagation(); setAddCourseSemId(sem.id); }}>
                          <IconPlus size={13} /> Add Course
                        </Button>
                        <Button variant="ghost" size="sm" className="flex-1 text-(--c-grade-e) hover:bg-(--c-grade-e)/10" onClick={e => { e.stopPropagation(); setDeleteId(sem.id); }}>
                          <IconTrash size={13} /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>

      <SemesterSheet open={showNew} onClose={() => setShowNew(false)} />
      <SemesterSheet open={!!editingSem} onClose={() => setEditingSem(undefined)} existing={editingSem} />
      <CourseEditSheet
        open={addCourseSemId !== null}
        onClose={() => setAddCourseSemId(null)}
        semesterId={addCourseSemId ?? undefined}
        onSaved={newId => navigate(`/courses/${newId}`)}
      />
      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Delete Semester"
        description="This will permanently delete the semester and all its courses, criteria, and scores."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
