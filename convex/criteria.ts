import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query('criteria').withIndex('by_createdAt').collect();
  },
});

export const byCourse = query({
  args: { courseId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query('criteria')
      .withIndex('by_courseId', q => q.eq('courseId', args.courseId as Id<'courses'>))
      .collect();
  },
});

export const create = mutation({
  args: {
    courseId: v.string(),
    name: v.string(),
    weight: v.number(),
    instanceCount: v.number(),
    canvasGroupId: v.optional(v.number()),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert('criteria', {
      ...args,
      courseId: args.courseId as Id<'courses'>,
    });
  },
});

export const update = mutation({
  args: {
    id: v.string(),
    name: v.optional(v.string()),
    weight: v.optional(v.number()),
    instanceCount: v.optional(v.number()),
    manualScore: v.optional(v.number()),
    manualScoreEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    const patch: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(rest)) {
      if (val !== undefined) patch[k] = val;
    }
    await ctx.db.patch(id as Id<'criteria'>, patch);
  },
});

export const remove = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const id = args.id as Id<'criteria'>;
    const entries = await ctx.db
      .query('scoreEntries')
      .withIndex('by_criterionId', q => q.eq('criterionId', id))
      .collect();
    for (const entry of entries) await ctx.db.delete(entry._id);
    await ctx.db.delete(id);
  },
});
