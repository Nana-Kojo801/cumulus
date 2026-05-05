import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { CanvasConnection } from '@/db/schema';

export function useCanvasConnection(): { connection: CanvasConnection | undefined; isLoading: boolean } {
  const doc = useQuery(api.canvasConnections.get);
  if (doc === undefined) return { connection: undefined, isLoading: true };
  if (!doc) return { connection: undefined, isLoading: false };
  return {
    isLoading: false,
    connection: {
      id: doc._id,
      domain: doc.domain,
      token: doc.token,
      connectedAt: doc.connectedAt,
      studentName: doc.studentName,
      studentId: doc.studentId,
      lastSyncedAt: doc.lastSyncedAt,
    },
  };
}
