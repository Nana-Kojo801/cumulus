import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';

async function requireUserId(ctx: { auth: { getUserIdentity(): Promise<{ tokenIdentifier: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error('Not authenticated');
  return identity.tokenIdentifier;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return ctx.db
      .query('courses')
      .withIndex('by_userId_createdAt', q => q.eq('userId', identity.tokenIdentifier))
      .collect();
  },
});

export const get = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id as Id<'courses'>);
  },
});

export const bySemester = query({
  args: { semesterId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query('courses')
      .withIndex('by_semesterId', q => q.eq('semesterId', args.semesterId as Id<'semesters'>))
      .collect();
  },
});

export const create = mutation({
  args: {
    semesterId: v.string(),
    code: v.string(),
    name: v.string(),
    shortName: v.optional(v.string()),
    credits: v.number(),
    canvasId: v.optional(v.number()),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    return ctx.db.insert('courses', {
      userId,
      ...args,
      semesterId: args.semesterId as Id<'semesters'>,
    });
  },
});

export const update = mutation({
  args: {
    id: v.string(),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    shortName: v.optional(v.string()),
    credits: v.optional(v.number()),
    semesterId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, semesterId, ...rest } = args;
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (v !== undefined) patch[k] = v;
    }
    if (semesterId !== undefined) patch.semesterId = semesterId as Id<'semesters'>;
    await ctx.db.patch(id as Id<'courses'>, patch);
  },
});

export const remove = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const id = args.id as Id<'courses'>;
    const criteria = await ctx.db
      .query('criteria')
      .withIndex('by_courseId', q => q.eq('courseId', id))
      .collect();

    for (const criterion of criteria) {
      const entries = await ctx.db
        .query('scoreEntries')
        .withIndex('by_criterionId', q => q.eq('criterionId', criterion._id))
        .collect();
      for (const entry of entries) await ctx.db.delete(entry._id);
      await ctx.db.delete(criterion._id);
    }
    await ctx.db.delete(id);
  },
});
