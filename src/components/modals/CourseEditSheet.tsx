import { useState, useEffect } from 'react';
import { IconMinus, IconPlus } from '@/components/icons';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Chip } from '@/components/ui/Chip';
import { useSemesters } from '@/hooks/useSemesters';
import { useCourse } from '@/hooks/useCourses';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useToast } from '@/components/ui/Toast';

interface CourseEditSheetProps {
  open: boolean;
  onClose: () => void;
  semesterId?: string;
  courseId?: string;
  onSaved?: (id: string) => void;
}

export function CourseEditSheet({ open, onClose, semesterId: initSemId, courseId, onSaved }: CourseEditSheetProps) {
  const { toast } = useToast();
  const isNew = !courseId;
  const semesters = useSemesters() ?? [];
  const existingCourse = useCourse(courseId);
  const createCourse = useMutation(api.courses.create);
  const updateCourse = useMutation(api.courses.update);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [credits, setCredits] = useState(3);
  const [semesterId, setSemesterId] = useState('');

  useEffect(() => {
    if (!open) return;
    if (existingCourse) {
      setName(existingCourse.name);
      setCode(existingCourse.code ?? '');
      setCredits(existingCourse.credits);
      setSemesterId(existingCourse.semesterId);
    } else {
      setName('');
      setCode('');
      setCredits(3);
      setSemesterId(initSemId ?? semesters.find(s => s.status === 'active')?.id ?? '');
    }
  }, [open, existingCourse, initSemId]);

  async function handleSave() {
    if (!name.trim()) return;
    if (isNew) {
      const newId = await createCourse({
        semesterId,
        code: code.trim(),
        name: name.trim(),
        credits,
        createdAt: Date.now(),
      });
      toast('Course created');
      onSaved?.(newId);
    } else {
      await updateCourse({ id: courseId!, name: name.trim(), code: code.trim(), credits, semesterId });
      toast('Course updated');
      onSaved?.(courseId!);
    }
    onClose();
  }

  const sorted = [...semesters].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.term - b.term;
  });

  return (
    <Sheet open={open} onClose={onClose} title={isNew ? 'New Course' : 'Edit Course'} fullHeight>
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto p-5 flex flex-col gap-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cs-name">Course Name *</Label>
              <Input
                id="cs-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Database Systems"
                autoFocus={open}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cs-code">Course Code</Label>
              <Input
                id="cs-code"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="e.g. CS 311"
                className="font-mono uppercase"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Credit Hours</Label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCredits(c => Math.max(1, c - 1))}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-(--c-surface-2) border border-(--c-line) text-(--c-text-2) hover:bg-(--c-surface-3) transition-all cursor-pointer"
                >
                  <IconMinus size={14} />
                </button>
                <span className="text-[22px] font-semibold tabular-nums text-(--c-text) w-8 text-center">{credits}</span>
                <button
                  onClick={() => setCredits(c => Math.min(6, c + 1))}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-(--c-surface-2) border border-(--c-line) text-(--c-text-2) hover:bg-(--c-surface-3) transition-all cursor-pointer"
                >
                  <IconPlus size={14} />
                </button>
                <span className="text-[12px] text-(--c-text-3)">1–4 credits typical</span>
              </div>
            </div>
          </div>

          {sorted.length > 1 && (
            <div className="flex flex-col gap-2">
              <Label>Semester</Label>
              <div className="flex flex-col gap-1.5">
                {sorted.map(sem => (
                  <button
                    key={sem.id}
                    onClick={() => setSemesterId(sem.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-(--radius-r3) border text-left transition-all cursor-pointer ${
                      semesterId === sem.id
                        ? 'bg-(--c-accent-bg) border-(--c-accent)/30 text-(--c-text)'
                        : 'bg-(--c-surface-2) border-(--c-line) text-(--c-text-2) hover:bg-(--c-surface-3)'
                    }`}
                  >
                    <span className="flex-1 text-[14px]">{sem.name}</span>
                    {sem.status === 'active' && <Chip variant="accent" className="text-[11px]">Active</Chip>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-(--c-line) flex justify-end gap-2 px-5 py-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={!name.trim() || !semesterId}>
            {isNew ? 'Create Course' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
