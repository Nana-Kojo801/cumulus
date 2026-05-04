import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query('semesters').withIndex('by_createdAt').collect();
  },
});

export const get = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id as Id<'semesters'>);
  },
});

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query('semesters')
      .withIndex('by_status', q => q.eq('status', 'active'))
      .first();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    year: v.optional(v.number()),
    term: v.optional(v.number()),
    status: v.union(v.literal('active'), v.literal('complete')),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.status === 'active') {
      const active = await ctx.db
        .query('semesters')
        .withIndex('by_status', q => q.eq('status', 'active'))
        .first();
      if (active) await ctx.db.patch(active._id, { status: 'complete' });
    }
    return ctx.db.insert('semesters', {
      name: args.name,
      status: args.status,
      createdAt: args.createdAt,
      ...(args.year !== undefined ? { year: args.year } : {}),
      ...(args.term !== undefined ? { term: args.term } : {}),
    });
  },
});

export const update = mutation({
  args: {
    id: v.string(),
    name: v.string(),
    year: v.optional(v.number()),
    term: v.optional(v.number()),
    status: v.union(v.literal('active'), v.literal('complete')),
  },
  handler: async (ctx, args) => {
    const id = args.id as Id<'semesters'>;
    if (args.status === 'active') {
      const current = await ctx.db
        .query('semesters')
        .withIndex('by_status', q => q.eq('status', 'active'))
        .first();
      if (current && current._id !== id) {
        await ctx.db.patch(current._id, { status: 'complete' });
      }
    }
    await ctx.db.patch(id, {
      name: args.name,
      status: args.status,
      ...(args.year !== undefined ? { year: args.year } : {}),
      ...(args.term !== undefined ? { term: args.term } : {}),
    });
  },
});

export const setStatus = mutation({
  args: {
    id: v.string(),
    status: v.union(v.literal('active'), v.literal('complete')),
  },
  handler: async (ctx, args) => {
    const id = args.id as Id<'semesters'>;
    if (args.status === 'active') {
      const current = await ctx.db
        .query('semesters')
        .withIndex('by_status', q => q.eq('status', 'active'))
        .first();
      if (current && current._id !== id) {
        await ctx.db.patch(current._id, { status: 'complete' });
      }
    }
    await ctx.db.patch(id, { status: args.status });
  },
});

export const remove = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const id = args.id as Id<'semesters'>;
    const courses = await ctx.db
      .query('courses')
      .withIndex('by_semesterId', q => q.eq('semesterId', id))
      .collect();

    for (const course of courses) {
      const criteria = await ctx.db
        .query('criteria')
        .withIndex('by_courseId', q => q.eq('courseId', course._id))
        .collect();

      for (const criterion of criteria) {
        const entries = await ctx.db
          .query('scoreEntries')
          .withIndex('by_criterionId', q => q.eq('criterionId', criterion._id))
          .collect();
        for (const entry of entries) await ctx.db.delete(entry._id);
        await ctx.db.delete(criterion._id);
      }
      await ctx.db.delete(course._id);
    }
    await ctx.db.delete(id);
  },
});
