import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query('scoreEntries').withIndex('by_createdAt').collect();
  },
});

export const saveAll = mutation({
  args: {
    criterionId: v.string(),
    toCreate: v.array(v.object({
      label: v.string(),
      score: v.union(v.number(), v.null()),
      total: v.number(),
    })),
    toUpdate: v.array(v.object({
      id: v.string(),
      label: v.string(),
      score: v.union(v.number(), v.null()),
      total: v.number(),
    })),
    toDelete: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const criterionId = args.criterionId as Id<'criteria'>;

    for (const entry of args.toCreate) {
      await ctx.db.insert('scoreEntries', {
        criterionId,
        label: entry.label,
        score: entry.score,
        total: entry.total,
        manuallyEdited: true,
        createdAt: Date.now(),
      });
    }

    for (const entry of args.toUpdate) {
      await ctx.db.patch(entry.id as Id<'scoreEntries'>, {
        label: entry.label,
        score: entry.score,
        total: entry.total,
        manuallyEdited: true,
      });
    }

    for (const id of args.toDelete) {
      await ctx.db.delete(id as Id<'scoreEntries'>);
    }

    const instanceCount = args.toCreate.length + args.toUpdate.length;
    await ctx.db.patch(criterionId, { instanceCount });
  },
});
