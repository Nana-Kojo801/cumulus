export interface CanvasUser {
  id: number;
  name: string;
  short_name: string;
  login_id: string;
}

export interface CanvasTerm {
  id: number;
  name: string;
  start_at: string | null;
  end_at: string | null;
}

export interface CanvasEnrollment {
  type: string;
  enrollment_state: string;
  computed_current_score: number | null;
  computed_final_score: number | null;
  computed_current_grade: string | null;
  computed_final_grade: string | null;
}

export interface CanvasCourse {
  id: number;
  name: string;
  course_code: string;
  workflow_state: 'available' | 'completed' | 'unpublished' | 'deleted';
  start_at: string | null;
  end_at: string | null;
  term: CanvasTerm | null;
  enrollments: CanvasEnrollment[];
}

export interface CanvasSubmission {
  score: number | null;
  grade: string | null;
  submitted_at: string | null;
  workflow_state: 'submitted' | 'unsubmitted' | 'graded' | 'pending_review';
  missing: boolean;
  late: boolean;
  excused: boolean;
}

export interface CanvasAssignment {
  id: number;
  name: string;
  points_possible: number;
  due_at: string | null;
  workflow_state: string;
  submission: CanvasSubmission | null;
}

export interface CanvasAssignmentGroup {
  id: number;
  name: string;
  group_weight: number;
  assignments: CanvasAssignment[];
}
