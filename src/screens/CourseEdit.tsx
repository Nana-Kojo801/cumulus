import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { IconMinus, IconPlus } from '@/components/icons';
import { Topbar } from '@/components/layout/Topbar';
import { useMenuOpen } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Chip } from '@/components/ui/Chip';
import { useSemesters } from '@/hooks/useSemesters';
import { useCourse } from '@/hooks/useCourses';
import { api } from '../../convex/_generated/api';
import { useToast } from '@/components/ui/Toast';
import { displayCourseName } from '@/lib/utils';
import { useDisplayPrefs } from '@/contexts/DisplayPrefsContext';
import { useOfflineMutation } from '@/lib/useOfflineMutation';

export function CourseEdit() {
  const onMenuOpen = useMenuOpen();
  const { showShortNames } = useDisplayPrefs();
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = !id;

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

  const semesters = useSemesters() ?? [];
  const existingCourse = useCourse(id);

  const defaultSemesterId = searchParams.get('semester') ?? semesters.find(s => s.status === 'active')?.id ?? '';

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [credits, setCredits] = useState(3);
  const [semesterId, setSemesterId] = useState(defaultSemesterId);

  useEffect(() => {
    if (existingCourse) {
      setName(existingCourse.name);
      setCode(existingCourse.code ?? '');
      setCredits(existingCourse.credits);
      setSemesterId(existingCourse.semesterId);
    }
  }, [existingCourse]);

  useEffect(() => {
    if (!semesterId && semesters.length > 0) {
      setSemesterId(semesters.find(s => s.status === 'active')?.id ?? semesters[0].id);
    }
  }, [semesters, semesterId]);

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
      navigate(`/courses/${newId}`);
    } else {
      await updateCourse({ id: id!, name: name.trim(), code: code.trim(), credits, semesterId });
      toast('Course updated');
      navigate(`/courses/${id}`);
    }
  }

  const sorted = [...semesters].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title={isNew ? 'New Course' : 'Edit Course'}
        back={isNew ? 'Semesters' : (existingCourse ? displayCourseName(existingCourse, showShortNames) : 'Course')}
        onMenuOpen={onMenuOpen}
      />
      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-lg mx-auto flex flex-col gap-5">
          <Card className="p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="course-name">Course Name *</Label>
              <Input
                id="course-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Database Systems"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="course-code">Course Code</Label>
              <Input
                id="course-code"
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
                <span className="text-[12px] text-(--c-text-3)">Typical Ashesi range: 1–4</span>
              </div>
            </div>
          </Card>

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
                      : 'bg-(--c-surface) border-(--c-line) text-(--c-text-2) hover:bg-(--c-surface-2)'
                  }`}
                >
                  <span className="flex-1 text-[14px]">{sem.name}</span>
                  {sem.status === 'active' && <Chip variant="accent" className="text-[11px]">Active</Chip>}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} disabled={!name.trim() || !semesterId}>
              {isNew ? 'Create Course' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
