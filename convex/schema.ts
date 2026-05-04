import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  semesters: defineTable({
    name: v.string(),
    year: v.optional(v.number()),
    term: v.optional(v.number()),
    status: v.union(v.literal('complete'), v.literal('active')),
    createdAt: v.number(),
  })
    .index('by_status', ['status'])
    .index('by_createdAt', ['createdAt'])
    .index('by_name', ['name']),

  courses: defineTable({
    semesterId: v.id('semesters'),
    code: v.string(),
    name: v.string(),
    shortName: v.optional(v.string()),
    credits: v.number(),
    canvasId: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_semesterId', ['semesterId'])
    .index('by_canvasId', ['canvasId'])
    .index('by_createdAt', ['createdAt']),

  criteria: defineTable({
    courseId: v.id('courses'),
    name: v.string(),
    weight: v.number(),
    instanceCount: v.number(),
    canvasGroupId: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_courseId', ['courseId'])
    .index('by_createdAt', ['createdAt']),

  scoreEntries: defineTable({
    criterionId: v.id('criteria'),
    label: v.string(),
    score: v.union(v.number(), v.null()),
    total: v.number(),
    canvasAssignmentId: v.optional(v.number()),
    manuallyEdited: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index('by_criterionId', ['criterionId'])
    .index('by_canvasAssignmentId', ['canvasAssignmentId'])
    .index('by_createdAt', ['createdAt']),

  canvasConnections: defineTable({
    domain: v.string(),
    token: v.string(),
    connectedAt: v.number(),
    studentName: v.string(),
    studentId: v.number(),
    lastSyncedAt: v.optional(v.number()),
  }),

  users: defineTable({
    name: v.string(),
    email: v.string(),
    externalId: v.string(),
    onboardingComplete: v.boolean(),
    createdAt: v.number(),
  })
    .index('byExternalId', ['externalId']),
});
