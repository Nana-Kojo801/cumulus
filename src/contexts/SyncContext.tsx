import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { useQuery, useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { localDb } from '@/lib/localDb';
import { useOnlineStatus } from '@/lib/useOnlineStatus';
import { getPendingCount } from '@/lib/offlineQueue';
import type { Semester, Course, Criterion, ScoreEntry } from '@/db/schema';

function mapSemester(doc: Record<string, unknown>): Semester {
  return {
    id: doc._id as string,
    name: doc.name as string,
    year: doc.year as number | undefined,
    term: doc.term as number | undefined,
    status: doc.status as 'active' | 'complete',
    createdAt: doc.createdAt as number,
  };
}
function mapCourse(doc: Record<string, unknown>): Course {
  return {
    id: doc._id as string,
    semesterId: doc.semesterId as string,
    code: (doc.code as string) ?? '',
    name: doc.name as string,
    shortName: doc.shortName as string | undefined,
    credits: doc.credits as number,
    canvasId: doc.canvasId as number | undefined,
    createdAt: doc.createdAt as number,
  };
}
function mapCriterion(doc: Record<string, unknown>): Criterion {
  return {
    id: doc._id as string,
    courseId: doc.courseId as string,
    name: doc.name as string,
    weight: doc.weight as number,
    instanceCount: doc.instanceCount as number,
    canvasGroupId: doc.canvasGroupId as number | undefined,
    createdAt: doc.createdAt as number,
  };
}
function mapEntry(doc: Record<string, unknown>): ScoreEntry {
  return {
    id: doc._id as string,
    criterionId: doc.criterionId as string,
    label: doc.label as string,
    score: doc.score as number | null,
    total: doc.total as number,
    canvasAssignmentId: doc.canvasAssignmentId as number | undefined,
    manuallyEdited: doc.manuallyEdited as boolean | undefined,
    createdAt: doc.createdAt as number,
  };
}

interface SyncContextValue {
  semesters: Semester[] | undefined;
  courses: Course[] | undefined;
  criteria: Criterion[] | undefined;
  scoreEntries: ScoreEntry[] | undefined;
  isOnline: boolean;
  pendingCount: number;
  refreshPendingCount: () => void;
}

const SyncContext = createContext<SyncContextValue>({
  semesters: undefined,
  courses: undefined,
  criteria: undefined,
  scoreEntries: undefined,
  isOnline: true,
  pendingCount: 0,
  refreshPendingCount: () => {},
});

export function useSyncContext() {
  return useContext(SyncContext);
}

function useWithLocalFallback<T>(
  convexData: T[] | undefined,
  loadLocal: () => Promise<T[]>,
  saveLocal: (data: T[]) => Promise<void>,
): T[] | undefined {
  const [local, setLocal] = useState<T[] | undefined>(undefined);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      loadLocal().then(d => { if (d.length > 0) setLocal(d); });
    }
  }, []);

  useEffect(() => {
    if (convexData !== undefined) {
      setLocal(convexData);
      saveLocal(convexData).catch(console.error);
    }
  }, [convexData]);

  return convexData ?? local;
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const isOnline = useOnlineStatus();
  const convex = useConvex();
  const [pendingCount, setPendingCount] = useState(0);

  const convexSemesters = useQuery(api.semesters.list);
  const convexCourses = useQuery(api.courses.list);
  const convexCriteria = useQuery(api.criteria.list);
  const convexEntries = useQuery(api.scoreEntries.list);

  const mappedSemesters = useMemo(
    () => convexSemesters?.map(d => mapSemester(d as Record<string, unknown>)),
    [convexSemesters],
  );
  const mappedCourses = useMemo(
    () => convexCourses?.map(d => mapCourse(d as Record<string, unknown>)),
    [convexCourses],
  );
  const mappedCriteria = useMemo(
    () => convexCriteria?.map(d => mapCriterion(d as Record<string, unknown>)),
    [convexCriteria],
  );
  const mappedEntries = useMemo(
    () => convexEntries?.map(d => mapEntry(d as Record<string, unknown>)),
    [convexEntries],
  );

  const semesters = useWithLocalFallback(
    mappedSemesters,
    () => localDb.semesters.toArray(),
    data => localDb.semesters.bulkPut(data).then(() => undefined),
  );
  const courses = useWithLocalFallback(
    mappedCourses,
    () => localDb.courses.toArray(),
    data => localDb.courses.bulkPut(data).then(() => undefined),
  );
  const criteria = useWithLocalFallback(
    mappedCriteria,
    () => localDb.criteria.toArray(),
    data => localDb.criteria.bulkPut(data).then(() => undefined),
  );
  const scoreEntries = useWithLocalFallback(
    mappedEntries,
    () => localDb.scoreEntries.toArray(),
    data => localDb.scoreEntries.bulkPut(data).then(() => undefined),
  );

  const refreshPendingCount = useCallback(() => {
    getPendingCount().then(setPendingCount);
  }, []);

  useEffect(() => { refreshPendingCount(); }, [refreshPendingCount]);

  // Replay pending mutations when coming back online
  const wasOfflineRef = useRef(!navigator.onLine);
  useEffect(() => {
    if (isOnline && wasOfflineRef.current) {
      wasOfflineRef.current = false;
      replayPendingMutations(convex).then(refreshPendingCount);
    } else if (!isOnline) {
      wasOfflineRef.current = true;
    }
  }, [isOnline, convex, refreshPendingCount]);

  return (
    <SyncContext.Provider value={{ semesters, courses, criteria, scoreEntries, isOnline, pendingCount, refreshPendingCount }}>
      {children}
    </SyncContext.Provider>
  );
}

async function replayPendingMutations(convex: ReturnType<typeof useConvex>): Promise<void> {
  const pending = await localDb.pendingMutations.orderBy('createdAt').toArray();
  if (pending.length === 0) return;

  const idMap = new Map<string, string>();

  for (const mutation of pending) {
    try {
      let args = mutation.args as Record<string, unknown>;

      // Remap any temp IDs created during offline session
      for (const [tempId, field] of Object.entries(mutation.tempIds)) {
        const realId = idMap.get(tempId);
        if (realId && field in args) {
          args = { ...args, [field]: realId };
        }
      }

      const name = mutation.name as string;
      let result: unknown;

      if (name === 'semesters/create') {
        const a = args as Record<string, unknown>;
        result = await convex.mutation(api.semesters.create, {
          name: a.name as string,
          status: a.status as 'active' | 'complete',
          createdAt: a.createdAt as number,
        });
        if (a.tempId && result) idMap.set(a.tempId as string, result as string);
      }
      else if (name === 'semesters/update') {
        const a = args as Record<string, unknown>;
        await convex.mutation(api.semesters.update, {
          id: a.id as string,
          name: a.name as string,
          status: a.status as 'active' | 'complete',
        });
      }
      else if (name === 'semesters/remove') {
        await convex.mutation(api.semesters.remove, { id: args.id as string });
      }
      else if (name === 'semesters/setStatus') {
        await convex.mutation(api.semesters.setStatus, {
          id: args.id as string,
          status: args.status as 'active' | 'complete',
        });
      }
      else if (name === 'courses/create') {
        const a = args as Record<string, unknown>;
        const semesterId = idMap.get(a.semesterId as string) ?? (a.semesterId as string);
        result = await convex.mutation(api.courses.create, {
          semesterId,
          code: a.code as string,
          name: a.name as string,
          credits: a.credits as number,
          createdAt: a.createdAt as number,
        });
        if (a.tempId && result) idMap.set(a.tempId as string, result as string);
      }
      else if (name === 'courses/update') {
        const a = args as Record<string, unknown>;
        await convex.mutation(api.courses.update, {
          id: a.id as string,
          name: a.name as string,
          code: a.code as string,
          credits: a.credits as number,
          semesterId: a.semesterId as string,
        });
      }
      else if (name === 'courses/remove') {
        await convex.mutation(api.courses.remove, { id: args.id as string });
      }
      else if (name === 'criteria/create') {
        const a = args as Record<string, unknown>;
        const courseId = idMap.get(a.courseId as string) ?? (a.courseId as string);
        result = await convex.mutation(api.criteria.create, {
          courseId,
          name: a.name as string,
          weight: a.weight as number,
          instanceCount: a.instanceCount as number,
          createdAt: a.createdAt as number,
        });
        if (a.tempId && result) idMap.set(a.tempId as string, result as string);
      }
      else if (name === 'criteria/update') {
        const a = args as Record<string, unknown>;
        await convex.mutation(api.criteria.update, {
          id: a.id as string,
          name: a.name as string,
          weight: a.weight as number,
          instanceCount: a.instanceCount as number,
        });
      }
      else if (name === 'criteria/remove') {
        await convex.mutation(api.criteria.remove, { id: args.id as string });
      }
      else if (name === 'scoreEntries/saveAll') {
        const a = args as Record<string, unknown>;
        const criterionId = idMap.get(a.criterionId as string) ?? (a.criterionId as string);
        await convex.mutation(api.scoreEntries.saveAll, {
          criterionId,
          ...(a as any),
        });
      }
      else if (name === 'data/clearAll') {
        await convex.mutation(api.data.clearAll, {});
      }

      await localDb.pendingMutations.delete(mutation.id);
    } catch (err) {
      console.error('Failed to replay mutation', mutation.name, err);
    }
  }
}
