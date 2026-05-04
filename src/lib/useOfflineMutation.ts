import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import { useOnlineStatus } from './useOnlineStatus';
import { applyLocalMutation, queueMutation, type MutationName, type QueuedMutation } from './offlineQueue';
import { useSyncContext } from '@/contexts/SyncContext';
import type { FunctionReference } from 'convex/server';

export function useOfflineMutation<Args extends Record<string, unknown>, Return>(
  mutationRef: FunctionReference<'mutation', 'public', Args, Return>,
  mutationName: MutationName,
  buildLocalArgs: (args: Args) => QueuedMutation['args'],
): (args: Args) => Promise<Return | undefined> {
  const isOnline = useOnlineStatus();
  const convexMutation = useMutation(mutationRef);
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
    return undefined;
  }, [isOnline, convexMutation, mutationName, buildLocalArgs, refreshPendingCount]);
}
