import { mutation } from './_generated/server';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';

export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const semesters = await ctx.db.query('semesters').collect();
    for (const s of semesters) await ctx.db.delete(s._id);
    const courses = await ctx.db.query('courses').collect();
    for (const c of courses) await ctx.db.delete(c._id);
    const criteria = await ctx.db.query('criteria').collect();
    for (const c of criteria) await ctx.db.delete(c._id);
    const entries = await ctx.db.query('scoreEntries').collect();
    for (const e of entries) await ctx.db.delete(e._id);
  },
});

export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const semesters = await ctx.db.query('semesters').collect();
    for (const s of semesters) await ctx.db.delete(s._id);
    const courses = await ctx.db.query('courses').collect();
    for (const c of courses) await ctx.db.delete(c._id);
    const criteria = await ctx.db.query('criteria').collect();
    for (const c of criteria) await ctx.db.delete(c._id);
    const entries = await ctx.db.query('scoreEntries').collect();
    for (const e of entries) await ctx.db.delete(e._id);
    const connections = await ctx.db.query('canvasConnections').collect();
    for (const conn of connections) await ctx.db.delete(conn._id);
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      const user = await ctx.db
        .query('users')
        .withIndex('byExternalId', q => q.eq('externalId', identity.subject))
        .unique();
      if (user) await ctx.db.delete(user._id);
    }
  },
});

export const clearAndImport = mutation({
  args: {
    semesters: v.array(v.object({
      id: v.string(),
      name: v.string(),
      year: v.number(),
      term: v.number(),
      status: v.union(v.literal('active'), v.literal('complete')),
      createdAt: v.number(),
    })),
    courses: v.array(v.object({
      id: v.string(),
      semesterId: v.string(),
      code: v.string(),
      name: v.string(),
      credits: v.number(),
      canvasId: v.optional(v.number()),
      createdAt: v.number(),
    })),
    criteria: v.array(v.object({
      id: v.string(),
      courseId: v.string(),
      name: v.string(),
      weight: v.number(),
      instanceCount: v.number(),
      canvasGroupId: v.optional(v.number()),
      createdAt: v.number(),
    })),
    scoreEntries: v.array(v.object({
      id: v.string(),
      criterionId: v.string(),
      label: v.string(),
      score: v.union(v.number(), v.null()),
      total: v.number(),
      canvasAssignmentId: v.optional(v.number()),
      manuallyEdited: v.optional(v.boolean()),
      createdAt: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    // Clear existing data
    const existingSems = await ctx.db.query('semesters').collect();
    for (const s of existingSems) await ctx.db.delete(s._id);
    const existingCourses = await ctx.db.query('courses').collect();
    for (const c of existingCourses) await ctx.db.delete(c._id);
    const existingCriteria = await ctx.db.query('criteria').collect();
    for (const c of existingCriteria) await ctx.db.delete(c._id);
    const existingEntries = await ctx.db.query('scoreEntries').collect();
    for (const e of existingEntries) await ctx.db.delete(e._id);

    // Import with ID remapping
    const semIdMap = new Map<string, Id<'semesters'>>();
    for (const sem of args.semesters) {
      const newId = await ctx.db.insert('semesters', {
        name: sem.name,
        year: sem.year,
        term: sem.term,
        status: sem.status,
        createdAt: sem.createdAt,
      });
      semIdMap.set(sem.id, newId);
    }

    const courseIdMap = new Map<string, Id<'courses'>>();
    for (const course of args.courses) {
      const semesterId = semIdMap.get(course.semesterId);
      if (!semesterId) continue;
      const newId = await ctx.db.insert('courses', {
        semesterId,
        code: course.code,
        name: course.name,
        credits: course.credits,
        canvasId: course.canvasId,
        createdAt: course.createdAt,
      });
      courseIdMap.set(course.id, newId);
    }

    const criterionIdMap = new Map<string, Id<'criteria'>>();
    for (const criterion of args.criteria) {
      const courseId = courseIdMap.get(criterion.courseId);
      if (!courseId) continue;
      const newId = await ctx.db.insert('criteria', {
        courseId,
        name: criterion.name,
        weight: criterion.weight,
        instanceCount: criterion.instanceCount,
        canvasGroupId: criterion.canvasGroupId,
        createdAt: criterion.createdAt,
      });
      criterionIdMap.set(criterion.id, newId);
    }

    for (const entry of args.scoreEntries) {
      const criterionId = criterionIdMap.get(entry.criterionId);
      if (!criterionId) continue;
      await ctx.db.insert('scoreEntries', {
        criterionId,
        label: entry.label,
        score: entry.score,
        total: entry.total,
        canvasAssignmentId: entry.canvasAssignmentId,
        manuallyEdited: entry.manuallyEdited,
        createdAt: entry.createdAt,
      });
    }
  },
});
