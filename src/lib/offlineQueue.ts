import { localDb } from './localDb';
import type { Semester, Course, Criterion, ScoreEntry } from '@/db/schema';

export type MutationName =
  | 'semesters/create' | 'semesters/update' | 'semesters/remove' | 'semesters/setStatus'
  | 'courses/create' | 'courses/update' | 'courses/remove'
  | 'criteria/create' | 'criteria/update' | 'criteria/remove'
  | 'scoreEntries/saveAll'
  | 'data/clearAll';

export interface QueuedMutation {
  name: MutationName;
  args: unknown;
  tempIds: Record<string, string>;
}

export async function applyLocalMutation(mutation: QueuedMutation): Promise<void> {
  const { name, args } = mutation;

  if (name === 'semesters/create') {
    const a = args as Omit<Semester, 'id'> & { tempId: string };
    if (a.status === 'active') {
      await localDb.semesters.where('status').equals('active').modify({ status: 'complete' });
    }
    await localDb.semesters.put({ ...a, id: a.tempId });
  }
  else if (name === 'semesters/update') {
    const a = args as Partial<Semester> & { id: string };
    if (a.status === 'active') {
      await localDb.semesters.where('status').equals('active').modify({ status: 'complete' });
    }
    await localDb.semesters.update(a.id, a);
  }
  else if (name === 'semesters/remove') {
    const { id } = args as { id: string };
    const courses = await localDb.courses.where('semesterId').equals(id).toArray();
    for (const c of courses) {
      const criteria = await localDb.criteria.where('courseId').equals(c.id).toArray();
      for (const cr of criteria) {
        await localDb.scoreEntries.where('criterionId').equals(cr.id).delete();
        await localDb.criteria.delete(cr.id);
      }
      await localDb.courses.delete(c.id);
    }
    await localDb.semesters.delete(id);
  }
  else if (name === 'semesters/setStatus') {
    const a = args as { id: string; status: 'active' | 'complete' };
    if (a.status === 'active') {
      await localDb.semesters.where('status').equals('active').modify({ status: 'complete' });
    }
    await localDb.semesters.update(a.id, { status: a.status });
  }
  else if (name === 'courses/create') {
    const a = args as Omit<Course, 'id'> & { tempId: string };
    await localDb.courses.put({ ...a, id: a.tempId });
  }
  else if (name === 'courses/update') {
    const a = args as Partial<Course> & { id: string };
    await localDb.courses.update(a.id, a);
  }
  else if (name === 'courses/remove') {
    const { id } = args as { id: string };
    const criteria = await localDb.criteria.where('courseId').equals(id).toArray();
    for (const cr of criteria) {
      await localDb.scoreEntries.where('criterionId').equals(cr.id).delete();
      await localDb.criteria.delete(cr.id);
    }
    await localDb.courses.delete(id);
  }
  else if (name === 'criteria/create') {
    const a = args as Omit<Criterion, 'id'> & { tempId: string };
    await localDb.criteria.put({ ...a, id: a.tempId });
  }
  else if (name === 'criteria/update') {
    const a = args as Partial<Criterion> & { id: string };
    await localDb.criteria.update(a.id, a);
  }
  else if (name === 'criteria/remove') {
    const { id } = args as { id: string };
    await localDb.scoreEntries.where('criterionId').equals(id).delete();
    await localDb.criteria.delete(id);
  }
  else if (name === 'scoreEntries/saveAll') {
    const a = args as {
      criterionId: string;
      toCreate: Array<{ label: string; score: number | null; total: number }>;
      toUpdate: Array<{ id: string; label: string; score: number | null; total: number }>;
      toDelete: string[];
    };
    const now = Date.now();
    for (const e of a.toCreate) {
      await localDb.scoreEntries.put({
        id: crypto.randomUUID(),
        criterionId: a.criterionId,
        label: e.label,
        score: e.score,
        total: e.total,
        createdAt: now,
      });
    }
    for (const e of a.toUpdate) {
      await localDb.scoreEntries.update(e.id, { label: e.label, score: e.score, total: e.total });
    }
    for (const id of a.toDelete) {
      await localDb.scoreEntries.delete(id);
    }
  }
  else if (name === 'data/clearAll') {
    await localDb.semesters.clear();
    await localDb.courses.clear();
    await localDb.criteria.clear();
    await localDb.scoreEntries.clear();
  }
}

export async function queueMutation(mutation: QueuedMutation): Promise<void> {
  await localDb.pendingMutations.add({
    id: crypto.randomUUID(),
    name: mutation.name,
    args: mutation.args,
    tempIds: mutation.tempIds,
    createdAt: Date.now(),
  });
}

export async function getPendingCount(): Promise<number> {
  return localDb.pendingMutations.count();
}
