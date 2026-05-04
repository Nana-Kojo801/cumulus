import Dexie, { type Table } from 'dexie';
import type { Semester, Course, Criterion, ScoreEntry } from '@/db/schema';

export interface PendingMutation {
  id: string;
  name: string;
  args: unknown;
  tempIds: Record<string, string>;
  createdAt: number;
}

export interface CachedUser {
  id: string;
  name: string;
  email: string;
  onboardingComplete: boolean;
}

class CumulusDB extends Dexie {
  semesters!: Table<Semester, string>;
  courses!: Table<Course, string>;
  criteria!: Table<Criterion, string>;
  scoreEntries!: Table<ScoreEntry, string>;
  pendingMutations!: Table<PendingMutation, string>;
  userCache!: Table<CachedUser, string>;

  constructor() {
    super('cumulus-local-v1');
    this.version(1).stores({
      semesters: 'id, status, year, term',
      courses: 'id, semesterId',
      criteria: 'id, courseId',
      scoreEntries: 'id, criterionId',
      pendingMutations: 'id, createdAt',
      userCache: 'id',
    });
    this.version(2).stores({
      semesters: 'id, status, createdAt',
      courses: 'id, semesterId',
      criteria: 'id, courseId',
      scoreEntries: 'id, criterionId',
      pendingMutations: 'id, createdAt',
      userCache: 'id',
    });
  }
}

export const localDb = new CumulusDB();
