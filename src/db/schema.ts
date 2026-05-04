export interface Semester {
  id: string;
  name: string;
  year: number;
  term: number;
  status: 'complete' | 'active';
  createdAt: number;
}

export interface Course {
  id: string;
  semesterId: string;
  code: string;
  name: string;
  credits: number;
  canvasId?: number;
  createdAt: number;
}

export interface Criterion {
  id: string;
  courseId: string;
  name: string;
  weight: number;
  instanceCount: number;
  canvasGroupId?: number;
  createdAt: number;
}

export interface ScoreEntry {
  id: string;
  criterionId: string;
  label: string;
  score: number | null;
  total: number;
  canvasAssignmentId?: number;
  manuallyEdited?: boolean;
  createdAt: number;
}

export interface CanvasConnection {
  id: string;
  domain: string;
  token: string;
  connectedAt: number;
  studentName: string;
  studentId: number;
  lastSyncedAt?: number;
}
