import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  semesters: defineTable({
    userId: v.string(),
    name: v.string(),
    year: v.optional(v.number()),
    term: v.optional(v.number()),
    status: v.union(v.literal('complete'), v.literal('active')),
    createdAt: v.number(),
  })
    .index('by_userId', ['userId'])
    .index('by_userId_status', ['userId', 'status'])
    .index('by_userId_createdAt', ['userId', 'createdAt'])
    .index('by_status', ['status'])
    .index('by_createdAt', ['createdAt'])
    .index('by_name', ['name']),

  courses: defineTable({
    userId: v.string(),
    semesterId: v.id('semesters'),
    code: v.string(),
    name: v.string(),
    shortName: v.optional(v.string()),
    credits: v.number(),
    canvasId: v.optional(v.number()),
    manualGrade: v.optional(v.number()),
    manualGradeEnabled: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index('by_userId', ['userId'])
    .index('by_userId_createdAt', ['userId', 'createdAt'])
    .index('by_semesterId', ['semesterId'])
    .index('by_canvasId', ['canvasId'])
    .index('by_createdAt', ['createdAt']),

  criteria: defineTable({
    courseId: v.id('courses'),
    name: v.string(),
    weight: v.number(),
    instanceCount: v.number(),
    canvasGroupId: v.optional(v.number()),
    manualScore: v.optional(v.number()),
    manualScoreEnabled: v.optional(v.boolean()),
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
    userId: v.string(),
    domain: v.string(),
    token: v.string(),
    connectedAt: v.number(),
    studentName: v.string(),
    studentId: v.number(),
    lastSyncedAt: v.optional(v.number()),
  }).index('by_userId', ['userId']),

  users: defineTable({
    name: v.string(),
    email: v.string(),
    externalId: v.string(),
    onboardingComplete: v.boolean(),
    onboardingStep: v.optional(v.number()),
    tourDismissed: v.optional(v.boolean()),
    tourCompleted: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index('byExternalId', ['externalId']),
});
