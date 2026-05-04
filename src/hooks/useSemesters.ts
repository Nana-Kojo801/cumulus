import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Semester } from '@/db/schema';

function mapSemester(doc: { _id: string; name: string; year: number; term: number; status: 'complete' | 'active'; createdAt: number }): Semester {
  return { id: doc._id, name: doc.name, year: doc.year, term: doc.term, status: doc.status, createdAt: doc.createdAt };
}

export function useSemesters(): Semester[] | undefined {
  const docs = useQuery(api.semesters.list);
  if (docs === undefined) return undefined;
  return docs.map(mapSemester);
}

export function useSemester(id: string | undefined): Semester | undefined {
  const doc = useQuery(api.semesters.get, id ? { id } : 'skip');
  if (!doc) return undefined;
  return mapSemester(doc);
}

export function useActiveSemester(): Semester | undefined {
  const doc = useQuery(api.semesters.getActive);
  if (!doc) return undefined;
  return mapSemester(doc);
}
