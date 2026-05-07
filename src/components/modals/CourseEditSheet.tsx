import { useState, useEffect, useRef } from 'react';
import { IconMinus, IconPlus } from '@/components/icons';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { useSemesters } from '@/hooks/useSemesters';
import { useCourse } from '@/hooks/useCourses';
import { api } from '../../../convex/_generated/api';
import { useToast } from '@/components/ui/Toast';
import { useOfflineMutation } from '@/lib/useOfflineMutation';

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
  const createCourse = useOfflineMutation(
    api.courses.create,
    'courses/create',
    (args) => ({ ...args, tempId: crypto.randomUUID() }),
    (localArgs) => (localArgs as { tempId: string }).tempId,
  );
  const updateCourse = useOfflineMutation(
    api.courses.update,
    'courses/update',
    (args) => args,
  );

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [shortName, setShortName] = useState('');
  const [credits, setCredits] = useState(3);
  const [semesterId, setSemesterId] = useState('');

  // Use refs so the init effect only fires on open transition, not on every re-render
  // of existingCourse (which changes reference each render and would reset typed input).
  const existingCourseRef = useRef(existingCourse);
  existingCourseRef.current = existingCourse;
  const semestersRef = useRef(semesters);
  semestersRef.current = semesters;
  const initSemIdRef = useRef(initSemId);
  initSemIdRef.current = initSemId;

  useEffect(() => {
    if (!open) return;
    const course = existingCourseRef.current;
    const sems = semestersRef.current;
    const semId = initSemIdRef.current;
    if (course) {
      setName(course.name);
      setCode(course.code ?? '');
      setShortName(course.shortName ?? '');
      setCredits(course.credits);
      setSemesterId(course.semesterId);
    } else {
      setName('');
      setCode('');
      setShortName('');
      setCredits(3);
      setSemesterId(semId ?? sems.find(s => s.status === 'active')?.id ?? '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleSave() {
    if (!name.trim()) return;
    if (isNew) {
      const newId = await createCourse({
        semesterId,
        code: code.trim(),
        name: name.trim(),
        shortName: shortName.trim() || undefined,
        credits,
        createdAt: Date.now(),
      });
      toast('Course created');
      if (newId) onSaved?.(newId);
    } else {
      await updateCourse({ id: courseId!, name: name.trim(), code: code.trim(), shortName: shortName.trim() || undefined, credits, semesterId });
      toast('Course updated');
      onSaved?.(courseId!);
    }
    onClose();
  }

  const sorted = [...semesters].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));

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
              <Label htmlFor="cs-short-name">Short Name (optional)</Label>
              <Input
                id="cs-short-name"
                value={shortName}
                onChange={e => setShortName(e.target.value)}
                placeholder="e.g. DB Systems"
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

          {sorted.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label>Semester</Label>
              <Select value={semesterId} onValueChange={setSemesterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester..." />
                </SelectTrigger>
                <SelectContent>
                  {sorted.map(sem => (
                    <SelectItem key={sem.id} value={sem.id}>
                      {sem.name} {sem.status === 'active' ? '— Active' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
