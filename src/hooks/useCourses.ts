import { useSyncContext } from '@/contexts/SyncContext';
import type { Course } from '@/db/schema';

export function useCourses(): Course[] | undefined {
  return useSyncContext().courses;
}

export function useCourse(id: string | undefined): Course | undefined {
  const courses = useSyncContext().courses;
  return courses?.find(c => c.id === id);
}

export function useCoursesBySemester(semesterId: string | undefined): Course[] {
  const courses = useSyncContext().courses;
  return courses?.filter(c => c.semesterId === semesterId) ?? [];
}
