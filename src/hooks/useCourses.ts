import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';

export function useCourses() {
  return useLiveQuery(() => db.courses.orderBy('createdAt').toArray(), [], []);
}

export function useCourse(id: string | undefined) {
  return useLiveQuery(
    () => id ? db.courses.get(id) : undefined,
    [id]
  );
}

export function useCoursesBySemester(semesterId: string | undefined) {
  return useLiveQuery(
    () => semesterId ? db.courses.where('semesterId').equals(semesterId).toArray() : [],
    [semesterId],
    []
  );
}
