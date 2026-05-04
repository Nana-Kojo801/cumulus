import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useSyncContext } from '@/contexts/SyncContext';
import type { Criterion } from '@/db/schema';

function mapCriterion(doc: { _id: string; courseId: string; name: string; weight: number; instanceCount: number; canvasGroupId?: number; createdAt: number }): Criterion {
  return { id: doc._id, courseId: doc.courseId, name: doc.name, weight: doc.weight, instanceCount: doc.instanceCount, canvasGroupId: doc.canvasGroupId, createdAt: doc.createdAt };
}

export function useCriteria(): Criterion[] | undefined {
  return useSyncContext().criteria;
}

export function useCriteriaByCourse(courseId: string | undefined): Criterion[] {
  const criteria = useSyncContext().criteria;
  const doc = useQuery(api.criteria.byCourse, courseId ? { courseId } : 'skip');
  if (doc) return doc.map(mapCriterion);
  return criteria?.filter(c => c.courseId === courseId) ?? [];
}
