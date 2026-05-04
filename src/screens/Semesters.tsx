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
import { cleanCourseName } from '@/lib/utils';
import { useCriteria } from '@/hooks/useCriteria';
import { useScoreEntries } from '@/hooks/useScoreEntries';
import { cumulativeGPA, semesterGPA, courseRunningGrade, letterFor } from '@/lib/calculations';
import { fmtGPA, fmtPct } from '@/lib/utils';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useToast } from '@/components/ui/Toast';
import type { Semester } from '@/db/schema';

function Stepper({ value, onChange, min = 1, max = 99 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-9 h-9 flex items-center justify-center rounded-full bg-(--c-surface-2) border border-(--c-line) text-(--c-text-2) hover:bg-(--c-surface-3) transition-all cursor-pointer text-lg leading-none"
      >
        −
      </button>
      <span className="text-[22px] font-semibold tabular-nums text-(--c-text) w-8 text-center">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-9 h-9 flex items-center justify-center rounded-full bg-(--c-surface-2) border border-(--c-line) text-(--c-text-2) hover:bg-(--c-surface-3) transition-all cursor-pointer text-lg leading-none"
      >
        +
      </button>
    </div>
  );
}

interface SemesterSheetProps {
  open: boolean;
  onClose: () => void;
  existing?: Semester;
}

function SemesterSheet({ open, onClose, existing }: SemesterSheetProps) {
  const { toast } = useToast();
  const semesters = useSemesters() ?? [];
  const createSemester = useMutation(api.semesters.create);
  const updateSemester = useMutation(api.semesters.update);
  const isNew = !existing;

  const [year, setYear] = useState(1);
  const [term, setTerm] = useState(1);
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'complete' | 'active'>('active');

  useEffect(() => {
    if (open) {
      if (existing) {
        setYear(existing.year);
        setTerm(existing.term);
        setName(existing.name === `Year ${existing.year} · Semester ${existing.term}` ? '' : existing.name);
        setStatus(existing.status);
      } else {
        setYear(1);
        setTerm(1);
        setName('');
        setStatus('active');
      }
    }
  }, [open, existing]);

  const autoName = `Year ${year} · Semester ${term}`;
  const displayName = name.trim() || autoName;

  async function handleSave() {
    if (isNew) {
      await createSemester({ name: displayName, year, term, status, createdAt: Date.now() });
      toast('Semester created');
    } else {
      await updateSemester({ id: existing!.id, name: displayName, year, term, status });
      toast('Semester updated');
    }
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title={isNew ? 'New Semester' : 'Edit Semester'} fullHeight>
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto p-5 flex flex-col gap-5">

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Year</Label>
              <Stepper value={year} onChange={setYear} min={1} max={8} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Semester</Label>
              <Stepper value={term} onChange={setTerm} min={1} max={4} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Custom Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder={autoName} />
            <p className="text-[12px] text-(--c-text-4)">Leave blank to use auto-generated name</p>
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
          <Button variant="primary" onClick={handleSave}>
            {isNew ? 'Create Semester' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

export function Semesters() {
  const onMenuOpen = useMenuOpen();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showNew, setShowNew] = useState(false);
  const [editingSem, setEditingSem] = useState<Semester | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [autoOpened, setAutoOpened] = useState(false);
  const [addCourseSemId, setAddCourseSemId] = useState<string | null>(null);

  const removeSemester = useMutation(api.semesters.remove);
  const semesters = useSemesters() ?? [];

  useEffect(() => {
    if (autoOpened || semesters.length === 0) return;
    const active = semesters.find(s => s.status === 'active');
    if (active) setOpenIds(new Set([active.id]));
    setAutoOpened(true);
  }, [semesters, autoOpened]);

  const courses = useCourses() ?? [];
  const criteria = useCriteria() ?? [];
  const entries = useScoreEntries() ?? [];

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

  const sorted = [...semesters].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.term - b.term;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="Semesters"
        onMenuOpen={onMenuOpen}
        actions={
          <Button variant="primary" size="sm" onClick={() => setShowNew(true)}>
            <IconPlus size={14} /> New
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
                    {/* Name + meta */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-text)', letterSpacing: '-0.01em' }}>
                        {sem.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--c-text-3)', marginTop: 2 }}>
                        {semCourses.length} courses · {credits} credits
                        {isActive && <span style={{ color: 'var(--c-accent)', marginLeft: 6, fontWeight: 600 }}>· Active</span>}
                      </div>
                    </div>

                    {/* GPA — hidden on mobile */}
                    <div className="c-bignum hidden sm:block" style={{ fontSize: 24, textAlign: 'right' }}>
                      {fmtGPA(gpa)}
                    </div>

                    {/* Edit */}
                    <button
                      className="p-2 rounded-[10px] transition-all cursor-pointer"
                      style={{ color: 'var(--c-text-3)' }}
                      onClick={e => { e.stopPropagation(); setEditingSem(sem); }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = 'var(--c-surface-3)';
                        (e.currentTarget as HTMLElement).style.color = 'var(--c-text)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = 'var(--c-text-3)';
                      }}
                      title="Edit semester"
                    >
                      <IconEdit size={14} />
                    </button>

                    {/* Add course */}
                    <button
                      className="p-2 rounded-[10px] transition-all cursor-pointer"
                      style={{ color: 'var(--c-accent)' }}
                      onClick={e => { e.stopPropagation(); setAddCourseSemId(sem.id); }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = 'var(--c-accent-bg)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }}
                      title="Add course"
                    >
                      <IconPlus size={14} />
                    </button>

                    {/* Delete */}
                    <button
                      className="p-2 rounded-[10px] transition-all cursor-pointer"
                      style={{ color: 'var(--c-text-4)' }}
                      onClick={e => { e.stopPropagation(); setDeleteId(sem.id); }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.color = 'var(--c-grade-e)';
                        (e.currentTarget as HTMLElement).style.background = 'var(--c-danger-bg)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.color = 'var(--c-text-4)';
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }}
                    >
                      <IconTrash size={14} />
                    </button>

                    {/* Chevron */}
                    <IconChevronRight size={16} className="chev" />
                  </div>

                  {/* Accordion panel */}
                  <div className={`c-acc-panel ${isOpen ? 'open' : ''}`}>
                    <div className="inner">
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
                                  {cleanCourseName(course.name)}
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
