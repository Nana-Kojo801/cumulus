import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IconPlus, IconTrash } from '@/components/icons';
import { Topbar } from '@/components/layout/Topbar';
import { useMenuOpen } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { GradePill } from '@/components/ui/GradePill';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Tag } from '@/components/ui/Tag';
import { Chip } from '@/components/ui/Chip';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useSemester } from '@/hooks/useSemesters';
import { useCoursesBySemester } from '@/hooks/useCourses';
import { useCriteria } from '@/hooks/useCriteria';
import { useScoreEntries } from '@/hooks/useScoreEntries';
import { semesterGPA, courseRunningGrade, letterFor } from '@/lib/calculations';
import { fmtGPA, fmtPct } from '@/lib/utils';
import { db } from '@/db/schema';
import { useToast } from '@/components/ui/Toast';
import { useCourses } from '@/hooks/useCourses';
import { useSemesters } from '@/hooks/useSemesters';

export function SemesterDetail() {
  const onMenuOpen = useMenuOpen();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const semester = useSemester(id);
  const courses = useCoursesBySemester(id);
  const allCriteria = useCriteria() ?? [];
  const allEntries = useScoreEntries() ?? [];

  const criteria = allCriteria.filter(cr => courses.some(c => c.id === cr.courseId));
  const entries = allEntries.filter(e => criteria.some(cr => cr.id === e.criterionId));
  const allCourses = useCourses() ?? [];
  const semesters = useSemesters() ?? [];

  const { gpa, credits } = id
    ? semesterGPA(id, allCourses, allCriteria, allEntries)
    : { gpa: null, credits: 0 };

  async function handleDeleteCourse(courseId: string) {
    const courseCriteria = allCriteria.filter(cr => cr.courseId === courseId);
    const courseEntries = allEntries.filter(e => courseCriteria.some(cr => cr.id === e.criterionId));
    await db.transaction('rw', db.courses, db.criteria, db.scoreEntries, async () => {
      await db.scoreEntries.bulkDelete(courseEntries.map(e => e.id));
      await db.criteria.bulkDelete(courseCriteria.map(cr => cr.id));
      await db.courses.delete(courseId);
    });
    toast('Course deleted');
  }

  if (!semester) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <Topbar breadcrumbs={[{ label: 'Semesters', to: '/semesters' }, { label: 'Loading…' }]} onMenuOpen={onMenuOpen} />
        <div className="flex-1 flex items-center justify-center text-(--c-text-3)">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        breadcrumbs={[{ label: 'Semesters', to: '/semesters' }, { label: semester.name }]}
        onMenuOpen={onMenuOpen}
        actions={
          <Button variant="primary" size="sm" onClick={() => navigate(`/courses/new?semester=${id}`)}>
            <IconPlus size={14} /> Add Course
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-[22px] font-medium text-(--c-text)" style={{ letterSpacing: '-0.018em' }}>
                {semester.name}
              </h1>
              <Chip variant={semester.status === 'active' ? 'accent' : 'default'}>
                {semester.status === 'active' ? 'Active' : 'Complete'}
              </Chip>
            </div>
            <div className="text-[13px] text-(--c-text-3)">{credits} credits · {courses.length} courses</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-[11px] uppercase tracking-[0.08em] text-(--c-text-3)">Semester GPA</div>
            <div className="text-[36px] font-semibold tabular-nums text-(--c-text)" style={{ letterSpacing: '-0.028em' }}>
              {fmtGPA(gpa)}
            </div>
          </div>
        </div>

        {/* Courses grid */}
        {courses.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="text-(--c-text-3) text-[14px] mb-3">No courses yet.</p>
            <Button variant="primary" size="sm" onClick={() => navigate(`/courses/new?semester=${id}`)}>
              <IconPlus size={14} /> Add Course
            </Button>
          </Card>
        ) : (
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {courses.map(course => {
              const courseCriteria = allCriteria.filter(cr => cr.courseId === course.id);
              const courseEntries = allEntries.filter(e =>
                courseCriteria.some(cr => cr.id === e.criterionId)
              );
              const { pct, weightCompleted } = courseRunningGrade(course, courseCriteria, courseEntries);
              const letter = pct !== null ? letterFor(pct) : '—';

              return (
                <Card
                  key={course.id}
                  className="overflow-hidden group cursor-pointer hover:bg-(--c-surface-2) transition-colors"
                  onClick={() => navigate(`/courses/${course.id}`)}
                >
                  <div className="p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {course.code && <Tag className="mb-1">{course.code}</Tag>}
                        <div className="text-[14px] font-medium text-(--c-text) mt-1">{course.name}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        {pct !== null && letter !== '—' && <GradePill letter={letter} size="sm" />}
                        <button
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-(--c-text-4) hover:text-(--c-grade-e) transition-all cursor-pointer"
                          onClick={e => { e.stopPropagation(); setDeleteId(course.id); }}
                        >
                          <IconTrash size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Chip>{course.credits} cr</Chip>
                      <span className="text-[12px] text-(--c-text-3) font-mono tabular-nums">
                        {fmtPct(pct, 1)}
                      </span>
                    </div>
                    <ProgressBar value={weightCompleted} />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDeleteCourse(deleteId)}
        title="Delete Course"
        description="This will permanently delete the course and all its criteria and scores."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
