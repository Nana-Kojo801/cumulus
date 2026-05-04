import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { CanvasConnection } from '@/db/schema';

export function useCanvasConnection(): CanvasConnection | undefined {
  const doc = useQuery(api.canvasConnections.get);
  if (!doc) return undefined;
  return {
    id: doc._id,
    domain: doc.domain,
    token: doc.token,
    connectedAt: doc.connectedAt,
    studentName: doc.studentName,
    studentId: doc.studentId,
    lastSyncedAt: doc.lastSyncedAt,
  };
}
