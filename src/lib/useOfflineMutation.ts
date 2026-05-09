import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import { useOnlineStatus } from './useOnlineStatus';
import { applyLocalMutation, queueMutation, type MutationName, type QueuedMutation } from './offlineQueue';
import { useSyncContext } from '@/contexts/SyncContext';
import type { FunctionReference } from 'convex/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OptimisticUpdate<Args> = (localStore: any, args: Args) => void;

const NOOP_OPTIMISTIC: OptimisticUpdate<never> = () => {};

export function useOfflineMutation<Args extends Record<string, unknown>, Return>(
  mutationRef: FunctionReference<'mutation', 'public', Args, Return>,
  mutationName: MutationName,
  buildLocalArgs: (args: Args) => QueuedMutation['args'],
  getOfflineReturn?: (localArgs: QueuedMutation['args'], args: Args) => Return,
  optimisticUpdate?: OptimisticUpdate<Args>,
): (args: Args) => Promise<Return | undefined> {
  const isOnline = useOnlineStatus();
  // Always call .withOptimisticUpdate — no-op when none provided — to keep hook call count stable.
  const convexMutation = useMutation(mutationRef).withOptimisticUpdate(
    (optimisticUpdate ?? NOOP_OPTIMISTIC) as OptimisticUpdate<Args>,
  );
  const { refreshPendingCount } = useSyncContext();

  return useCallback(async (args: Args) => {
    if (isOnline) {
      return (convexMutation as any)(args);
    }

    const localArgs = buildLocalArgs(args);
    const mutation: QueuedMutation = {
      name: mutationName,
      args: localArgs,
      tempIds: {},
    };
    await applyLocalMutation(mutation);
    await queueMutation(mutation);
    refreshPendingCount();
    return getOfflineReturn ? getOfflineReturn(localArgs, args) : undefined;
  }, [isOnline, convexMutation, mutationName, buildLocalArgs, refreshPendingCount, getOfflineReturn]);
}
