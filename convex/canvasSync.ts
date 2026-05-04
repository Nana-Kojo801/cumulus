import { mutation } from './_generated/server';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';

interface SyncAssignment {
  canvasAssignmentId: number;
  label: string;
  total: number;
  score: number | null;
}

interface SyncCriterion {
  canvasGroupId: number;
  name: string;
  weight: number;
  assignments: SyncAssignment[];
  scoredCount: number;
}

interface SyncCourse {
  canvasId: number;
  name: string;
  code: string;
  isWeighted: boolean;
  workflowState: string;
  existingCumulusId?: string;
  criteria: SyncCriterion[];
}

interface SyncSemester {
  termId: number;
  name: string;
  year: number;
  term: number;
  status: 'active' | 'complete';
  courses: SyncCourse[];
}

export const executeSync = mutation({
  args: {
    semesters: v.any(),
    creditsByCanvasId: v.array(v.object({ canvasId: v.number(), credits: v.number() })),
    selectedCanvasIds: v.array(v.number()),
    connectionStudentName: v.string(),
    connectionStudentId: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');
    const userId = identity.tokenIdentifier;

    const semesters = args.semesters as SyncSemester[];
    const creditsMap = new Map(args.creditsByCanvasId.map(c => [c.canvasId, c.credits]));
    const selectedSet = new Set(args.selectedCanvasIds);

    // Load all user's semesters for name lookup
    const userSemesters = await ctx.db
      .query('semesters')
      .withIndex('by_userId', q => q.eq('userId', userId))
      .collect();

    for (const sem of semesters) {
      const selectedCourses = sem.courses.filter(c => selectedSet.has(c.canvasId));
      if (selectedCourses.length === 0) continue;

      let semesterId: Id<'semesters'>;
      const existingSem = userSemesters.find(s => s.name === sem.name);

      if (existingSem) {
        semesterId = existingSem._id;
      } else {
        if (sem.status === 'active') {
          const activeSem = await ctx.db
            .query('semesters')
            .withIndex('by_userId_status', q => q.eq('userId', userId).eq('status', 'active'))
            .first();
          if (activeSem) await ctx.db.patch(activeSem._id, { status: 'complete' });
        }
        semesterId = await ctx.db.insert('semesters', {
          userId,
          name: sem.name,
          year: sem.year,
          term: sem.term,
          status: sem.status,
          createdAt: Date.now(),
        });
      }

      for (const course of selectedCourses) {
        const courseCredits = creditsMap.get(course.canvasId) ?? 3;

        let courseId: Id<'courses'>;
        const existingCourse = await ctx.db
          .query('courses')
          .withIndex('by_canvasId', q => q.eq('canvasId', course.canvasId))
          .first();

        if (existingCourse && existingCourse.userId === userId) {
          courseId = existingCourse._id;
          await ctx.db.patch(existingCourse._id, {
            name: course.name,
            code: course.code,
            credits: courseCredits,
          });
        } else {
          courseId = await ctx.db.insert('courses', {
            userId,
            semesterId,
            code: course.code,
            name: course.name,
            credits: courseCredits,
            canvasId: course.canvasId,
            createdAt: Date.now(),
          });
        }

        const existingCriteria = await ctx.db
          .query('criteria')
          .withIndex('by_courseId', q => q.eq('courseId', courseId))
          .collect();

        for (const criterion of course.criteria) {
          let criterionId: Id<'criteria'>;
          const existingCrit = existingCriteria.find(c => c.canvasGroupId === criterion.canvasGroupId);

          if (existingCrit) {
            criterionId = existingCrit._id;
            await ctx.db.patch(existingCrit._id, {
              name: criterion.name,
              weight: criterion.weight,
              instanceCount: criterion.assignments.length,
            });
          } else {
            criterionId = await ctx.db.insert('criteria', {
              courseId,
              name: criterion.name,
              weight: criterion.weight,
              instanceCount: criterion.assignments.length,
              canvasGroupId: criterion.canvasGroupId,
              createdAt: Date.now(),
            });
          }

          for (const assignment of criterion.assignments) {
            const existingEntry = await ctx.db
              .query('scoreEntries')
              .withIndex('by_canvasAssignmentId', q =>
                q.eq('canvasAssignmentId', assignment.canvasAssignmentId)
              )
              .first();

            if (existingEntry) {
              if (!existingEntry.manuallyEdited) {
                await ctx.db.patch(existingEntry._id, {
                  score: assignment.score ?? null,
                  label: assignment.label,
                  total: assignment.total,
                });
              }
            } else {
              await ctx.db.insert('scoreEntries', {
                criterionId,
                label: assignment.label,
                score: assignment.score ?? null,
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

    const existingConn = await ctx.db
      .query('canvasConnections')
      .withIndex('by_userId', q => q.eq('userId', userId))
      .first();
    if (existingConn) {
      await ctx.db.patch(existingConn._id, { lastSyncedAt: Date.now() });
    }
  },
});
