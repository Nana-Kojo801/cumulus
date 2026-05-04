import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useSyncContext } from '@/contexts/SyncContext';
import type { Semester } from '@/db/schema';

function mapSemester(doc: { _id: string; name: string; year?: number; term?: number; status: 'complete' | 'active'; createdAt: number }): Semester {
  return { id: doc._id, name: doc.name, year: doc.year, term: doc.term, status: doc.status, createdAt: doc.createdAt };
}

export function useSemesters(): Semester[] | undefined {
  return useSyncContext().semesters;
}

export function useSemester(id: string | undefined): Semester | undefined {
  const semesters = useSyncContext().semesters;
  const doc = useQuery(api.semesters.get, id ? { id } : 'skip');
  if (doc) return mapSemester(doc);
  return semesters?.find(s => s.id === id);
}

export function useActiveSemester(): Semester | undefined {
  const semesters = useSyncContext().semesters;
  const doc = useQuery(api.semesters.getActive);
  if (doc) return mapSemester(doc);
  return semesters?.find(s => s.status === 'active');
}
