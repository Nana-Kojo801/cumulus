import { v4 as uuidv4 } from 'uuid';
import { canvasApi } from './client';
import type { CanvasConnection } from '@/db/schema';
import { db } from '@/db/schema';

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
  onProgress?: (e: SyncProgressEvent) => void
): Promise<SyncPreview> {
  onProgress?.({ step: 'verify', done: 0, total: 1, message: 'Verifying token…' });
  await canvasApi.getUser(connection.token);
  onProgress?.({ step: 'verify', done: 1, total: 1, message: 'Token verified' });

  onProgress?.({ step: 'courses', done: 0, total: 1, message: 'Fetching enrolled courses…' });
  const rawCourses = await canvasApi.getCourses(connection.token);
  onProgress?.({ step: 'courses', done: 1, total: 1, message: `Found ${rawCourses.length} courses` });

  // Check which courses already exist in Cumulus by canvasId
  const existingCourses = await db.courses.toArray();
  const existingByCanvasId = new Map(
    existingCourses.filter(c => c.canvasId).map(c => [c.canvasId!, c])
  );

  // Fetch assignment groups for all courses in parallel
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

  // Group courses by Canvas term
  const termMap = new Map<number, { termId: number; name: string; year: number; term: number; status: 'active' | 'complete'; courses: PreviewCourse[] }>();

  const warnings: SyncWarning[] = [];

  for (const { course, groups } of groupResults) {
    const term = course.term;
    if (!term) continue;

    // Parse year/term from term name, fall back to 0/0 for unknown
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

    // Mark semester as active if any course in it is currently running
    if (course.workflow_state === 'available') {
      semEntry.status = 'active';
    }

    // Map assignment groups → criteria + entries
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
              } else if (sub.workflow_state === 'graded' && sub.score === null) {
                score = null; // rare; treat as pending
              }
              // unsubmitted → null (pending)
            }
            // excused → skip entirely
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

  // Sort semesters chronologically
  const semesters = Array.from(termMap.values()).sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.term - b.term
  );

  // Ensure at most one active semester (the most recent one with available courses)
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

// ─── Execute sync (write to DB after user confirms) ──────────────────────────

export async function executeSync(
  preview: SyncPreview,
  credits: Record<number, number>,
  selected: Set<number>,
  connection: CanvasConnection
): Promise<void> {
  await db.transaction(
    'rw',
    [db.semesters, db.courses, db.criteria, db.scoreEntries, db.canvasConnections],
    async () => {
      for (const sem of preview.semesters) {
        const selectedCourses = sem.courses.filter(c => selected.has(c.canvasId));
        if (selectedCourses.length === 0) continue;

        // Find or create semester (match by name)
        let cumSemId: string;
        const existing = await db.semesters.filter(s => s.name === sem.name).first();
        if (existing) {
          cumSemId = existing.id;
        } else {
          // If creating an active semester, demote existing active one first
          if (sem.status === 'active') {
            await db.semesters.where('status').equals('active').modify({ status: 'complete' });
          }
          cumSemId = uuidv4();
          await db.semesters.add({
            id: cumSemId,
            name: sem.name,
            year: sem.year,
            term: sem.term,
            status: sem.status,
            createdAt: Date.now(),
          });
        }

        for (const course of selectedCourses) {
          const courseCredits = credits[course.canvasId] ?? 3;

          // Find or create course (match by canvasId)
          let cumCourseId: string;
          const existingCourse = await db.courses.where('canvasId').equals(course.canvasId).first();
          if (existingCourse) {
            cumCourseId = existingCourse.id;
            await db.courses.update(existingCourse.id, {
              name: course.name,
              code: course.code,
              credits: courseCredits,
            });
          } else {
            cumCourseId = uuidv4();
            await db.courses.add({
              id: cumCourseId,
              semesterId: cumSemId,
              code: course.code,
              name: course.name,
              credits: courseCredits,
              canvasId: course.canvasId,
              createdAt: Date.now(),
            });
          }

          // Get existing criteria for this course
          const existingCriteria = await db.criteria
            .where('courseId')
            .equals(cumCourseId)
            .toArray();

          for (const criterion of course.criteria) {
            let cumCritId: string;
            const existingCrit = existingCriteria.find(
              c => c.canvasGroupId === criterion.canvasGroupId
            );

            if (existingCrit) {
              cumCritId = existingCrit.id;
              await db.criteria.update(existingCrit.id, {
                name: criterion.name,
                weight: criterion.weight,
                instanceCount: criterion.assignments.length,
              });
            } else {
              cumCritId = uuidv4();
              await db.criteria.add({
                id: cumCritId,
                courseId: cumCourseId,
                name: criterion.name,
                weight: criterion.weight,
                instanceCount: criterion.assignments.length,
                canvasGroupId: criterion.canvasGroupId,
                createdAt: Date.now(),
              });
            }

            for (const assignment of criterion.assignments) {
              const existingEntry = await db.scoreEntries
                .where('canvasAssignmentId')
                .equals(assignment.canvasAssignmentId)
                .first();

              if (existingEntry) {
                // Never overwrite manually edited entries
                if (!existingEntry.manuallyEdited) {
                  await db.scoreEntries.update(existingEntry.id, {
                    score: assignment.score,
                    label: assignment.label,
                    total: assignment.total,
                  });
                }
              } else {
                await db.scoreEntries.add({
                  id: uuidv4(),
                  criterionId: cumCritId,
                  label: assignment.label,
                  score: assignment.score,
                  total: assignment.total,
                  canvasAssignmentId: assignment.canvasAssignmentId,
                  manuallyEdited: false,
                  createdAt: Date.now(),
                });
              }
            }
          }
        }
      }

      // Update the canvas connection with sync timestamp
      await db.canvasConnections.put({
        ...connection,
        lastSyncedAt: Date.now(),
      });
    }
  );
}
