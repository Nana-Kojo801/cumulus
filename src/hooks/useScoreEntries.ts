import { useSyncContext } from '@/contexts/SyncContext';
import type { ScoreEntry } from '@/db/schema';

export function useScoreEntries(): ScoreEntry[] | undefined {
  return useSyncContext().scoreEntries;
}
