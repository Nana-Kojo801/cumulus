import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useSyncContext } from '@/contexts/SyncContext';
import type { Course } from '@/db/schema';

function mapCourse(doc: { _id: string; semesterId: string; code: string; name: string; shortName?: string; credits: number; canvasId?: number; createdAt: number }): Course {
  return { id: doc._id, semesterId: doc.semesterId, code: doc.code, name: doc.name, shortName: doc.shortName, credits: doc.credits, canvasId: doc.canvasId, createdAt: doc.createdAt };
}

export function useCourses(): Course[] | undefined {
  return useSyncContext().courses;
}

export function useCourse(id: string | undefined): Course | undefined {
  const courses = useSyncContext().courses;
  const doc = useQuery(api.courses.get, id ? { id } : 'skip');
  if (doc) return mapCourse(doc);
  return courses?.find(c => c.id === id);
}

export function useCoursesBySemester(semesterId: string | undefined): Course[] {
  const courses = useSyncContext().courses;
  const doc = useQuery(api.courses.bySemester, semesterId ? { semesterId } : 'skip');
  if (doc) return doc.map(mapCourse);
  return courses?.filter(c => c.semesterId === semesterId) ?? [];
}
