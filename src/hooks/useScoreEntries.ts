import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { ScoreEntry } from '@/db/schema';

function mapEntry(doc: { _id: string; criterionId: string; label: string; score: number | null; total: number; canvasAssignmentId?: number; manuallyEdited?: boolean; createdAt: number }): ScoreEntry {
  return { id: doc._id, criterionId: doc.criterionId, label: doc.label, score: doc.score, total: doc.total, canvasAssignmentId: doc.canvasAssignmentId, manuallyEdited: doc.manuallyEdited, createdAt: doc.createdAt };
}

export function useScoreEntries(): ScoreEntry[] | undefined {
  const docs = useQuery(api.scoreEntries.list);
  if (docs === undefined) return undefined;
  return docs.map(mapEntry);
}
