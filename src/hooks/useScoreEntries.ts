import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';

export function useScoreEntries() {
  return useLiveQuery(() => db.scoreEntries.orderBy('createdAt').toArray(), [], []);
}

export function useScoreEntriesByCriterion(criterionId: string | undefined) {
  return useLiveQuery(
    () => criterionId ? db.scoreEntries.where('criterionId').equals(criterionId).toArray() : [],
    [criterionId],
    []
  );
}
