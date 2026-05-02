import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';

export function useCriteria() {
  return useLiveQuery(() => db.criteria.orderBy('createdAt').toArray(), [], []);
}

export function useCriteriaByCourse(courseId: string | undefined) {
  return useLiveQuery(
    () => courseId ? db.criteria.where('courseId').equals(courseId).toArray() : [],
    [courseId],
    []
  );
}
