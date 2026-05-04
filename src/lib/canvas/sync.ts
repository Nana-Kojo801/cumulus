import { canvasApi } from './client';
import type { CanvasConnection } from '@/db/schema';

// ─── Preview data model ──────────────────────────────────────────────────────

export interface PreviewAssignment {
  canvasAssignmentId: number;
  label: string;
  total: number;
  score: number | null;
}

export interface PreviewCriterion {
  canvasGroupId: number;
  name: string;
  weight: number;
  assignments: PreviewAssignment[];
  scoredCount: number;
}

export interface PreviewCourse {
  canvasId: number;
  name: string;
  code: string;
  isWeighted: boolean;
  workflowState: 'available' | 'completed' | string;
  existingCumulusId?: string;
  criteria: PreviewCriterion[];
}

export interface PreviewSemester {
  termId: number;
  name: string;
  year: number;
  term: number;
  status: 'active' | 'complete';
  courses: PreviewCourse[];
}

export interface SyncWarning {
  type: 'unweighted';
  courseName: string;
}

export interface SyncPreview {
  semesters: PreviewSemester[];
  warnings: SyncWarning[];
  totalCourses: number;
  totalCriteria: number;
  totalAssignments: number;
}

export interface SyncProgressEvent {
  step: 'verify' | 'courses' | 'groups';
  done: number;
  total: number;
  message: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseAshesiTerm(termName: string): { year: number; term: number } | null {
  const match = termName.match(/Year\s+(\d+)\s+Semester\s+(\d+)/i);
  if (!match) return null;
  return { year: parseInt(match[1]), term: parseInt(match[2]) };
}

function courseIsWeighted(totalWeight: number): boolean {
  return Math.abs(totalWeight - 100) < 1;
}

// ─── Build preview (no DB writes) ────────────────────────────────────────────

export async function buildSyncPreview(
  connection: CanvasConnection,
  existingCourses: Array<{ id: string; canvasId?: number }>,
  onProgress?: (e: SyncProgressEvent) => void
): Promise<SyncPreview> {
  onProgress?.({ step: 'verify', done: 0, total: 1, message: 'Verifying token…' });
  await canvasApi.getUser(connection.token);
  onProgress?.({ step: 'verify', done: 1, total: 1, message: 'Token verified' });

  onProgress?.({ step: 'courses', done: 0, total: 1, message: 'Fetching enrolled courses…' });
  const rawCourses = await canvasApi.getCourses(connection.token);
  onProgress?.({ step: 'courses', done: 1, total: 1, message: `Found ${rawCourses.length} courses` });

  const existingByCanvasId = new Map(
    existingCourses.filter(c => c.canvasId != null).map(c => [c.canvasId!, c])
  );

  const total = rawCourses.length;
  let done = 0;
  const groupResults = await Promise.all(
    rawCourses.map(async course => {
      const groups = await canvasApi.getAssignmentGroups(course.id, connection.token);
      done++;
      onProgress?.({
        step: 'groups',
        done,
        total,
        message: `Loading assignment groups (${done}/${total})…`,
      });
      return { course, groups };
    })
  );

  const termMap = new Map<number, { termId: number; name: string; year: number; term: number; status: 'active' | 'complete'; courses: PreviewCourse[] }>();
  const warnings: SyncWarning[] = [];

  for (const { course, groups } of groupResults) {
    const term = course.term;
    if (!term) continue;

    const parsed = parseAshesiTerm(term.name);

    if (!termMap.has(term.id)) {
      termMap.set(term.id, {
        termId: term.id,
        name: term.name,
        year: parsed?.year ?? 0,
        term: parsed?.term ?? 0,
        status: 'complete',
        courses: [],
      });
    }
    const semEntry = termMap.get(term.id)!;

    if (course.workflow_state === 'available') {
      semEntry.status = 'active';
    }

    const totalGroupWeight = groups.reduce((sum, g) => sum + (g.group_weight ?? 0), 0);
    const isWeighted = courseIsWeighted(totalGroupWeight);

    if (!isWeighted) {
      warnings.push({ type: 'unweighted', courseName: course.name });
    }

    const criteria: PreviewCriterion[] = groups
      .filter(g => g.assignments && g.assignments.length > 0)
      .map(group => {
        const assignments: PreviewAssignment[] = group.assignments
          .filter(a => a.workflow_state === 'published' && (a.points_possible ?? 0) > 0)
          .map(a => {
            const sub = a.submission;
            let score: number | null = null;
            if (sub && !sub.excused) {
              if (sub.workflow_state === 'graded' && sub.score !== null) {
                score = sub.score;
              }
            }
            return sub?.excused ? null : {
              canvasAssignmentId: a.id,
              label: a.name,
              total: a.points_possible,
              score,
            };
          })
          .filter((a): a is PreviewAssignment => a !== null);

        return {
          canvasGroupId: group.id,
          name: group.name,
          weight: group.group_weight,
          assignments,
          scoredCount: assignments.filter(a => a.score !== null).length,
        };
      });

    const previewCourse: PreviewCourse = {
      canvasId: course.id,
      name: course.name,
      code: course.course_code,
      isWeighted,
      workflowState: course.workflow_state,
      existingCumulusId: existingByCanvasId.get(course.id)?.id,
      criteria,
    };

    semEntry.courses.push(previewCourse);
  }

  const semesters = Array.from(termMap.values()).sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.term - b.term
  );

  const activeSems = semesters.filter(s => s.status === 'active');
  if (activeSems.length > 1) {
    for (let i = 0; i < activeSems.length - 1; i++) {
      activeSems[i].status = 'complete';
    }
  }

  const totalCourses = semesters.reduce((n, s) => n + s.courses.length, 0);
  const totalCriteria = semesters.reduce(
    (n, s) => n + s.courses.reduce((m, c) => m + c.criteria.length, 0),
    0
  );
  const totalAssignments = semesters.reduce(
    (n, s) => n + s.courses.reduce(
      (m, c) => m + c.criteria.reduce((k, cr) => k + cr.assignments.length, 0),
      0
    ),
    0
  );

  return { semesters, warnings, totalCourses, totalCriteria, totalAssignments };
}
