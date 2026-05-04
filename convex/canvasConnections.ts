import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

async function requireUserId(ctx: { auth: { getUserIdentity(): Promise<{ tokenIdentifier: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error('Not authenticated');
  return identity.tokenIdentifier;
}

export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return ctx.db
      .query('canvasConnections')
      .withIndex('by_userId', q => q.eq('userId', identity.tokenIdentifier))
      .first();
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
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query('canvasConnections')
      .withIndex('by_userId', q => q.eq('userId', userId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert('canvasConnections', { userId, ...args });
    }
  },
});

export const remove = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query('canvasConnections')
      .withIndex('by_userId', q => q.eq('userId', userId))
      .first();
    if (existing) await ctx.db.delete(existing._id);
  },
});

export const updateLastSynced = mutation({
  args: { lastSyncedAt: v.number() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query('canvasConnections')
      .withIndex('by_userId', q => q.eq('userId', userId))
      .first();
    if (existing) await ctx.db.patch(existing._id, { lastSyncedAt: args.lastSyncedAt });
  },
});
