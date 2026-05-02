import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconPlus, IconChevronRight, IconTrash } from '@/components/icons';
import { v4 as uuidv4 } from 'uuid';
import { motion } from 'framer-motion';
import { Topbar } from '@/components/layout/Topbar';
import { useMenuOpen } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Chip } from '@/components/ui/Chip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useSemesters } from '@/hooks/useSemesters';
import { useCourses } from '@/hooks/useCourses';
import { useCriteria } from '@/hooks/useCriteria';
import { useScoreEntries } from '@/hooks/useScoreEntries';
import { cumulativeGPA, semesterGPA } from '@/lib/calculations';
import { fmtGPA } from '@/lib/utils';
import { db } from '@/db/schema';
import { useToast } from '@/components/ui/Toast';

const listItem = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: 'easeOut', delay: i * 0.06 },
  }),
};

function NewSemesterModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const semesters = useSemesters() ?? [];
  const [year, setYear] = useState(1);
  const [term, setTerm] = useState(1);
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'complete' | 'active'>('active');

  const autoName = `Year ${year} · Semester ${term}`;
  const displayName = name || autoName;

  async function handleSave() {
    if (status === 'active') {
      const existing = semesters.find(s => s.status === 'active');
      if (existing) await db.semesters.update(existing.id, { status: 'complete' });
    }
    await db.semesters.add({
      id: uuidv4(),
      name: displayName,
      year,
      term,
      status,
      createdAt: Date.now(),
    });
    toast('Semester created');
    onClose();
    setName('');
  }

  return (
    <Modal open={open} onClose={onClose} title="New Semester" size="sm">
      <div className="p-5 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Year</Label>
            <Select value={String(year)} onValueChange={v => setYear(+v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map(y => (
                  <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Semester</Label>
            <Select value={String(term)} onValueChange={v => setTerm(+v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2].map(t => (
                  <SelectItem key={t} value={String(t)}>Semester {t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Name</Label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={autoName}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Status</Label>
          <div className="flex gap-2">
            {(['active', 'complete'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`flex-1 h-9 rounded-(--radius-r2) text-[13px] border transition-all cursor-pointer ${
                  status === s
                    ? 'bg-(--c-accent-bg) text-(--c-accent) border-(--c-accent)/30'
                    : 'bg-(--c-surface-2) text-(--c-text-2) border-(--c-line)'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          {status === 'active' && semesters.some(s => s.status === 'active') && (
            <p className="text-[12px] text-(--c-grade-c)">The current active semester will be marked complete.</p>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Create Semester</Button>
        </div>
      </div>
    </Modal>
  );
}

export function Semesters() {
  const onMenuOpen = useMenuOpen();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showNew, setShowNew] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const semesters = useSemesters() ?? [];
  const courses = useCourses() ?? [];
  const criteria = useCriteria() ?? [];
  const entries = useScoreEntries() ?? [];

  const cumulative = cumulativeGPA(semesters, courses, criteria, entries);

  async function handleDelete(semId: string) {
    const semCourses = courses.filter(c => c.semesterId === semId);
    const semCriteria = criteria.filter(cr => semCourses.some(c => c.id === cr.courseId));
    const semEntries = entries.filter(e => semCriteria.some(cr => cr.id === e.criterionId));
    await db.transaction('rw', db.semesters, db.courses, db.criteria, db.scoreEntries, async () => {
      await db.scoreEntries.bulkDelete(semEntries.map(e => e.id));
      await db.criteria.bulkDelete(semCriteria.map(cr => cr.id));
      await db.courses.bulkDelete(semCourses.map(c => c.id));
      await db.semesters.delete(semId);
    });
    toast('Semester deleted');
  }

  const sorted = [...semesters].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.term - b.term;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        breadcrumbs={[{ label: 'Semesters' }]}
        onMenuOpen={onMenuOpen}
        actions={
          <Button variant="primary" size="sm" onClick={() => setShowNew(true)}>
            <IconPlus size={14} /> New Semester
          </Button>
        }
      />
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
        {/* Cumulative summary */}
        <motion.div
          className="flex items-center gap-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div>
            <div className="text-[11px] uppercase tracking-[0.08em] text-(--c-text-3)">Cumulative GPA</div>
            <div className="text-[32px] font-semibold tabular-nums text-(--c-text)" style={{ letterSpacing: '-0.028em' }}>
              {fmtGPA(cumulative.gpa)}
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.08em] text-(--c-text-3)">Total Credits</div>
            <div className="text-[32px] font-semibold tabular-nums text-(--c-text)" style={{ letterSpacing: '-0.028em' }}>
              {cumulative.credits}
            </div>
          </div>
        </motion.div>

        {/* Semesters list */}
        {sorted.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="text-(--c-text-3) text-[14px] mb-3">No semesters yet.</p>
            <Button variant="primary" size="sm" onClick={() => setShowNew(true)}>
              <IconPlus size={14} /> New Semester
            </Button>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {sorted.map((sem, i) => {
              const { gpa, credits } = semesterGPA(sem.id, courses, criteria, entries);
              const semCourses = courses.filter(c => c.semesterId === sem.id);
              const preview = semCourses.slice(0, 3).map(c => c.name);

              return (
                <motion.div key={sem.id} custom={i} variants={listItem} initial="hidden" animate="show">
                  <Card className="overflow-hidden group">
                    <div
                      className="flex items-start gap-4 p-4 hover:bg-(--c-surface-2) transition-colors cursor-pointer"
                      onClick={() => navigate(`/semesters/${sem.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[15px] font-medium text-(--c-text)">{sem.name}</span>
                          <Chip variant={sem.status === 'active' ? 'accent' : 'default'} className="text-[11px]">
                            {sem.status === 'active' ? 'Active' : 'Complete'}
                          </Chip>
                        </div>
                        <div className="text-[12px] text-(--c-text-3)">
                          {semCourses.length} courses · {credits} credits
                        </div>
                        {preview.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {preview.map((name, j) => (
                              <span key={j} className="text-[12px] text-(--c-text-3)">
                                {name}{j < preview.length - 1 ? ',' : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-[22px] font-semibold tabular-nums text-(--c-text)" style={{ letterSpacing: '-0.02em' }}>
                          {fmtGPA(gpa)}
                        </div>
                        <button
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-(--radius-r1) text-(--c-text-4) hover:text-(--c-grade-e) hover:bg-(--c-grade-e)/10 transition-all cursor-pointer"
                          onClick={e => { e.stopPropagation(); setDeleteId(sem.id); }}
                        >
                          <IconTrash size={14} />
                        </button>
                        <IconChevronRight size={14} className="text-(--c-text-4)" />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <NewSemesterModal open={showNew} onClose={() => setShowNew(false)} />
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
