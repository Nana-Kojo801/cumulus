import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Course } from '@/db/schema';

function mapCourse(doc: { _id: string; semesterId: string; code: string; name: string; credits: number; canvasId?: number; createdAt: number }): Course {
  return { id: doc._id, semesterId: doc.semesterId, code: doc.code, name: doc.name, credits: doc.credits, canvasId: doc.canvasId, createdAt: doc.createdAt };
}

export function useCourses(): Course[] | undefined {
  const docs = useQuery(api.courses.list);
  if (docs === undefined) return undefined;
  return docs.map(mapCourse);
}

export function useCourse(id: string | undefined): Course | undefined {
  const doc = useQuery(api.courses.get, id ? { id } : 'skip');
  if (!doc) return undefined;
  return mapCourse(doc);
}

export function useCoursesBySemester(semesterId: string | undefined): Course[] {
  const docs = useQuery(api.courses.bySemester, semesterId ? { semesterId } : 'skip');
  if (!docs) return [];
  return docs.map(mapCourse);
}
