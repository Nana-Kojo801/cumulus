import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Criterion } from '@/db/schema';

function mapCriterion(doc: { _id: string; courseId: string; name: string; weight: number; instanceCount: number; canvasGroupId?: number; createdAt: number }): Criterion {
  return { id: doc._id, courseId: doc.courseId, name: doc.name, weight: doc.weight, instanceCount: doc.instanceCount, canvasGroupId: doc.canvasGroupId, createdAt: doc.createdAt };
}

export function useCriteria(): Criterion[] | undefined {
  const docs = useQuery(api.criteria.list);
  if (docs === undefined) return undefined;
  return docs.map(mapCriterion);
}

export function useCriteriaByCourse(courseId: string | undefined): Criterion[] {
  const docs = useQuery(api.criteria.byCourse, courseId ? { courseId } : 'skip');
  if (!docs) return [];
  return docs.map(mapCriterion);
}
