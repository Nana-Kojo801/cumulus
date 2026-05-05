import { useSyncContext } from '@/contexts/SyncContext';
import type { Criterion } from '@/db/schema';

export function useCriteria(): Criterion[] | undefined {
  return useSyncContext().criteria;
}

export function useCriteriaByCourse(courseId: string | undefined): Criterion[] {
  const criteria = useSyncContext().criteria;
  return criteria?.filter(c => c.courseId === courseId) ?? [];
}
