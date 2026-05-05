import { useSyncContext } from '@/contexts/SyncContext';
import type { Semester } from '@/db/schema';

export function useSemesters(): Semester[] | undefined {
  return useSyncContext().semesters;
}

export function useSemester(id: string | undefined): Semester | undefined {
  const semesters = useSyncContext().semesters;
  return semesters?.find(s => s.id === id);
}

export function useActiveSemester(): Semester | undefined {
  const semesters = useSyncContext().semesters;
  return semesters?.find(s => s.status === 'active');
}
