import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IconPlus, IconTrash, IconChevronRight } from '@/components/icons';
import { Topbar } from '@/components/layout/Topbar';
import { useMenuOpen } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { GradePill } from '@/components/ui/GradePill';
import { Chip } from '@/components/ui/Chip';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useSemester } from '@/hooks/useSemesters';
import { useCoursesBySemester, useCourses } from '@/hooks/useCourses';
import { useCriteria } from '@/hooks/useCriteria';
import { useScoreEntries } from '@/hooks/useScoreEntries';
import { semesterGPA, courseRunningGrade, letterFor } from '@/lib/calculations';
import { fmtGPA, fmtPct, cleanCourseName } from '@/lib/utils';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useToast } from '@/components/ui/Toast';

export function SemesterDetail() {
  const onMenuOpen = useMenuOpen();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const removeCourse = useMutation(api.courses.remove);
  const setSemesterStatus = useMutation(api.semesters.setStatus);

  const semester = useSemester(id);
  const courses = useCoursesBySemester(id);
  const allCriteria = useCriteria() ?? [];
  const allEntries = useScoreEntries() ?? [];
  const allCourses = useCourses() ?? [];

  const { gpa, credits } = id
    ? semesterGPA(id, allCourses, allCriteria, allEntries)
    : { gpa: null, credits: 0 };

  async function handleDeleteCourse(courseId: string) {
    await removeCourse({ id: courseId });
    toast('Course deleted');
  }

  async function handleToggleStatus() {
    if (!semester) return;
    const next = semester.status === 'active' ? 'complete' : 'active';
    await setSemesterStatus({ id: semester.id, status: next });
    toast(next === 'active' ? 'Semester set as active' : 'Semester marked complete');
  }

  if (!semester) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <Topbar title="Loading…" back="Semesters" onMenuOpen={onMenuOpen} />
        <div className="flex-1 flex items-center justify-center text-(--c-text-3)">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title={semester.name}
        back="Semesters"
        onMenuOpen={onMenuOpen}
        actions={
          <Button variant="primary" size="sm" onClick={() => navigate(`/courses/new?semester=${id}`)}>
            <IconPlus size={14} /> Add Course
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
        {/* Header row */}
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={handleToggleStatus} className="cursor-pointer">
                <Chip variant={semester.status === 'active' ? 'accent' : 'default'}>
                  {semester.status === 'active' ? 'Active' : 'Complete'}
                </Chip>
              </button>
              <span style={{ fontSize: 13, color: 'var(--c-text-3)' }}>
                {credits} credits · {courses.length} courses
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-text-4)', fontWeight: 700, marginBottom: 2 }}>
              GPA
            </div>
            <div className="c-bignum" style={{ fontSize: 36 }}>{fmtGPA(gpa)}</div>
          </div>
        </div>

        {/* Course list */}
        {courses.length === 0 ? (
          <div
            style={{
              padding: '60px 24px',
              border: '1.5px dashed var(--c-line-2)',
              borderRadius: 'var(--r-4)',
              textAlign: 'center',
              color: 'var(--c-text-3)',
            }}
          >
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, color: 'var(--c-text-2)', marginBottom: 8 }}>
              No courses yet
            </div>
            <p style={{ fontSize: 13, marginBottom: 18 }}>Add your first course to start tracking.</p>
            <Button variant="primary" size="sm" onClick={() => navigate(`/courses/new?semester=${id}`)}>
              <IconPlus size={14} /> Add Course
            </Button>
          </div>
        ) : (
          <div className="c-card overflow-hidden">
            {courses.map((course, i) => {
              const courseCriteria = allCriteria.filter(cr => cr.courseId === course.id);
              const courseEntries = allEntries.filter(e =>
                courseCriteria.some(cr => cr.id === e.criterionId)
              );
              const { pct } = courseRunningGrade(course, courseCriteria, courseEntries);
              const letter = pct !== null ? letterFor(pct) : '—';

              return (
                <div
                  key={course.id}
                  className="flex items-center gap-3 px-5 py-4 hover:bg-(--c-surface-2) transition-colors cursor-pointer group"
                  style={{ borderTop: i > 0 ? '1px solid var(--c-line)' : 'none' }}
                  onClick={() => navigate(`/courses/${course.id}`)}
                >
                  {course.code && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-4)', fontFamily: 'var(--f-mono)', minWidth: 48, flexShrink: 0 }}>
                      {course.code}
                    </span>
                  )}
                  <span className="flex-1 min-w-0 truncate" style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text)' }}>
                    {cleanCourseName(course.name)}
                  </span>
                  <span className="hidden sm:block shrink-0" style={{ fontSize: 12, color: 'var(--c-text-4)', fontFamily: 'var(--f-mono)' }}>
                    {course.credits} cr
                  </span>
                  <span className="shrink-0" style={{ fontSize: 13, fontFamily: 'var(--f-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--c-text-3)', minWidth: 48, textAlign: 'right' }}>
                    {fmtPct(pct, 1)}
                  </span>
                  {letter !== '—' ? <GradePill letter={letter} size="sm" /> : <span className="w-8 shrink-0" />}
                  <button
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-(--c-text-4) hover:text-(--c-grade-e) transition-all cursor-pointer shrink-0"
                    onClick={e => { e.stopPropagation(); setDeleteId(course.id); }}
                  >
                    <IconTrash size={13} />
                  </button>
                  <IconChevronRight size={14} className="text-(--c-text-4) shrink-0" />
                </div>
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
