import { internalMutation, mutation, query } from './_generated/server';
import type { QueryCtx } from './_generated/server';
import type { UserJSON } from '@clerk/backend';
import { v, type Validator } from 'convex/values';

export const current = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

export const upsertFromClerk = internalMutation({
  args: { data: v.any() as Validator<UserJSON> },
  async handler(ctx, { data }) {
    const userAttributes = {
      name: `${data.first_name} ${data.last_name}`.trim(),
      email: data.email_addresses[0]?.email_address ?? '',
      externalId: data.id,
      onboardingComplete: false,
      createdAt: Date.now(),
    };

    const user = await userByExternalId(ctx, data.id);
    if (user === null) {
      await ctx.db.insert('users', userAttributes);
    } else {
      await ctx.db.patch(user._id, {
        name: userAttributes.name,
        email: userAttributes.email,
      });
    }
  },
});

export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  async handler(ctx, { clerkUserId }) {
    const user = await userByExternalId(ctx, clerkUserId);
    if (user !== null) {
      await ctx.db.delete(user._id);
    }
  },
});

export const completeOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');
    const user = await userByExternalId(ctx, identity.subject);
    if (!user) throw new Error('User not found');
    await ctx.db.patch(user._id, { onboardingComplete: true, onboardingStep: undefined });
  },
});

export const saveOnboardingStep = mutation({
  args: { step: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');
    const user = await userByExternalId(ctx, identity.subject);
    if (!user) throw new Error('User not found');
    await ctx.db.patch(user._id, { onboardingStep: args.step });
  },
});

export const updateTour = mutation({
  args: {
    tourDismissed: v.optional(v.boolean()),
    tourCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');
    const user = await userByExternalId(ctx, identity.subject);
    if (!user) throw new Error('User not found');
    const patch: Record<string, unknown> = {};
    if (args.tourDismissed !== undefined) patch.tourDismissed = args.tourDismissed;
    if (args.tourCompleted !== undefined) patch.tourCompleted = args.tourCompleted;
    await ctx.db.patch(user._id, patch);
  },
});

export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await userByExternalId(ctx, identity.subject);
}

export async function getCurrentUserOrThrow(ctx: QueryCtx) {
  const user = await getCurrentUser(ctx);
  if (!user) throw new Error('User not found');
  return user;
}

async function userByExternalId(ctx: QueryCtx, externalId: string) {
  return await ctx.db
    .query('users')
    .withIndex('byExternalId', (q) => q.eq('externalId', externalId))
    .unique();
}
