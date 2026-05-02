import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';

export function useSemesters() {
  return useLiveQuery(
    () => db.semesters.orderBy('createdAt').toArray(),
    [],
    []
  );
}

export function useSemester(id: string | undefined) {
  return useLiveQuery(
    () => id ? db.semesters.get(id) : undefined,
    [id]
  );
}

export function useActiveSemester() {
  return useLiveQuery(() => db.semesters.where('status').equals('active').first(), []);
}
