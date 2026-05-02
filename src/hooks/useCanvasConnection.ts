import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/schema';

export function useCanvasConnection() {
  return useLiveQuery(() => db.canvasConnections.get('default'), []);
}
