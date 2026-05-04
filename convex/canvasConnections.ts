import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const get = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query('canvasConnections').first();
  },
});

export const upsert = mutation({
  args: {
    domain: v.string(),
    token: v.string(),
    connectedAt: v.number(),
    studentName: v.string(),
    studentId: v.number(),
    lastSyncedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('canvasConnections').first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert('canvasConnections', args);
    }
  },
});

export const remove = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query('canvasConnections').first();
    if (existing) await ctx.db.delete(existing._id);
  },
});

export const updateLastSynced = mutation({
  args: { lastSyncedAt: v.number() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('canvasConnections').first();
    if (existing) await ctx.db.patch(existing._id, { lastSyncedAt: args.lastSyncedAt });
  },
});
