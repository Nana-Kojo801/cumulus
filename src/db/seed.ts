import { v4 as uuidv4 } from 'uuid';
import { db } from './schema';
import type { Semester, Course, Criterion, ScoreEntry } from './schema';

function id() { return uuidv4(); }
function now(offset = 0) { return Date.now() - offset; }

export async function seedDatabase() {
  const count = await db.semesters.count();
  if (count > 0) return;

  // ── Semesters ──────────────────────────────────────────────────────────────
  const s1Id = id(), s2Id = id(), s3Id = id(), s4Id = id();
  const semesters: Semester[] = [
    { id: s1Id, name: 'Year 1 · Semester 1', year: 1, term: 1, status: 'complete', createdAt: now(86400000 * 500) },
    { id: s2Id, name: 'Year 1 · Semester 2', year: 1, term: 2, status: 'complete', createdAt: now(86400000 * 370) },
    { id: s3Id, name: 'Year 2 · Semester 1', year: 2, term: 1, status: 'complete', createdAt: now(86400000 * 240) },
    { id: s4Id, name: 'Year 2 · Semester 2', year: 2, term: 2, status: 'active',   createdAt: now(86400000 * 60) },
  ];

  // ── Y1S1 Courses ───────────────────────────────────────────────────────────
  const c11 = id(), c12 = id(), c13 = id(), c14 = id(), c15 = id();
  const y1s1Courses: Course[] = [
    { id: c11, semesterId: s1Id, code: 'CS 101', name: 'Introduction to Computing', credits: 3, createdAt: now(86400000 * 490) },
    { id: c12, semesterId: s1Id, code: 'MATH 111', name: 'Calculus I', credits: 3, createdAt: now(86400000 * 489) },
    { id: c13, semesterId: s1Id, code: 'ENG 101', name: 'Academic Writing', credits: 2, createdAt: now(86400000 * 488) },
    { id: c14, semesterId: s1Id, code: 'BUS 101', name: 'Foundations of Business', credits: 3, createdAt: now(86400000 * 487) },
    { id: c15, semesterId: s1Id, code: 'LAS 101', name: 'Leadership & African Studies', credits: 2, createdAt: now(86400000 * 486) },
  ];

  // ── Y1S2 Courses ───────────────────────────────────────────────────────────
  const c21 = id(), c22 = id(), c23 = id(), c24 = id(), c25 = id();
  const y1s2Courses: Course[] = [
    { id: c21, semesterId: s2Id, code: 'CS 151', name: 'Programming Fundamentals', credits: 3, createdAt: now(86400000 * 360) },
    { id: c22, semesterId: s2Id, code: 'MATH 112', name: 'Calculus II', credits: 3, createdAt: now(86400000 * 359) },
    { id: c23, semesterId: s2Id, code: 'CS 161', name: 'Discrete Mathematics', credits: 3, createdAt: now(86400000 * 358) },
    { id: c24, semesterId: s2Id, code: 'ENG 102', name: 'Critical Thinking & Comm.', credits: 2, createdAt: now(86400000 * 357) },
    { id: c25, semesterId: s2Id, code: 'PHY 101', name: 'Physics for Engineers', credits: 3, createdAt: now(86400000 * 356) },
  ];

  // ── Y2S1 Courses ───────────────────────────────────────────────────────────
  const c31 = id(), c32 = id(), c33 = id(), c34 = id(), c35 = id();
  const y2s1Courses: Course[] = [
    { id: c31, semesterId: s3Id, code: 'CS 211', name: 'Data Structures & Algorithms', credits: 3, createdAt: now(86400000 * 230) },
    { id: c32, semesterId: s3Id, code: 'CS 221', name: 'Computer Organization', credits: 3, createdAt: now(86400000 * 229) },
    { id: c33, semesterId: s3Id, code: 'MATH 221', name: 'Linear Algebra', credits: 3, createdAt: now(86400000 * 228) },
    { id: c34, semesterId: s3Id, code: 'CS 241', name: 'Object-Oriented Programming', credits: 3, createdAt: now(86400000 * 227) },
    { id: c35, semesterId: s3Id, code: 'BUS 201', name: 'Entrepreneurship I', credits: 2, createdAt: now(86400000 * 226) },
  ];

  // ── Y2S2 Courses (active, partially scored) ────────────────────────────────
  const c41 = id(), c42 = id(), c43 = id(), c44 = id(), c45 = id();
  const y2s2Courses: Course[] = [
    { id: c41, semesterId: s4Id, code: 'CS 311', name: 'Database Systems', credits: 3, createdAt: now(86400000 * 50) },
    { id: c42, semesterId: s4Id, code: 'CS 321', name: 'Operating Systems', credits: 3, createdAt: now(86400000 * 49) },
    { id: c43, semesterId: s4Id, code: 'CS 331', name: 'Computer Networks', credits: 3, createdAt: now(86400000 * 48) },
    { id: c44, semesterId: s4Id, code: 'MATH 311', name: 'Probability & Statistics', credits: 3, createdAt: now(86400000 * 47) },
    { id: c45, semesterId: s4Id, code: 'CS 341', name: 'Software Engineering', credits: 3, createdAt: now(86400000 * 46) },
  ];

  const allCourses = [...y1s1Courses, ...y1s2Courses, ...y2s1Courses, ...y2s2Courses];

  // ── Helper: create scored criteria ─────────────────────────────────────────
  function makeCriteria(courseId: string, specs: Array<{ name: string; weight: number; instances: Array<{ label: string; score: number | null; total: number }> }>): { criteria: Criterion[]; entries: ScoreEntry[] } {
    const criteria: Criterion[] = [];
    const entries: ScoreEntry[] = [];
    for (const spec of specs) {
      const critId = id();
      criteria.push({ id: critId, courseId, name: spec.name, weight: spec.weight, instanceCount: spec.instances.length, createdAt: now() });
      spec.instances.forEach((inst, i) => {
        entries.push({ id: id(), criterionId: critId, label: inst.label, score: inst.score, total: inst.total, createdAt: now(i * 1000) });
      });
    }
    return { criteria, entries };
  }

  // ── Y1S1 criteria & scores (fully scored) ──────────────────────────────────
  const { criteria: cr11, entries: en11 } = makeCriteria(c11, [
    { name: 'Assignments', weight: 20, instances: [{ label: 'Assignment 1', score: 88, total: 100 }, { label: 'Assignment 2', score: 82, total: 100 }, { label: 'Assignment 3', score: 90, total: 100 }] },
    { name: 'Midterm', weight: 30, instances: [{ label: 'Midterm', score: 76, total: 100 }] },
    { name: 'Final Exam', weight: 50, instances: [{ label: 'Final', score: 80, total: 100 }] },
  ]);
  const { criteria: cr12, entries: en12 } = makeCriteria(c12, [
    { name: 'Quizzes', weight: 15, instances: [{ label: 'Quiz 1', score: 14, total: 20 }, { label: 'Quiz 2', score: 16, total: 20 }, { label: 'Quiz 3', score: 12, total: 20 }] },
    { name: 'Homework', weight: 20, instances: [{ label: 'HW 1', score: 45, total: 50 }, { label: 'HW 2', score: 48, total: 50 }] },
    { name: 'Midterm', weight: 30, instances: [{ label: 'Midterm', score: 68, total: 100 }] },
    { name: 'Final Exam', weight: 35, instances: [{ label: 'Final', score: 72, total: 100 }] },
  ]);
  const { criteria: cr13, entries: en13 } = makeCriteria(c13, [
    { name: 'Essays', weight: 40, instances: [{ label: 'Essay 1', score: 78, total: 100 }, { label: 'Essay 2', score: 82, total: 100 }] },
    { name: 'Participation', weight: 20, instances: [{ label: 'Participation', score: 85, total: 100 }] },
    { name: 'Final Paper', weight: 40, instances: [{ label: 'Final Paper', score: 80, total: 100 }] },
  ]);
  const { criteria: cr14, entries: en14 } = makeCriteria(c14, [
    { name: 'Case Studies', weight: 30, instances: [{ label: 'Case 1', score: 74, total: 100 }, { label: 'Case 2', score: 80, total: 100 }] },
    { name: 'Group Project', weight: 30, instances: [{ label: 'Group Project', score: 86, total: 100 }] },
    { name: 'Final Exam', weight: 40, instances: [{ label: 'Final', score: 77, total: 100 }] },
  ]);
  const { criteria: cr15, entries: en15 } = makeCriteria(c15, [
    { name: 'Reflections', weight: 30, instances: [{ label: 'Reflection 1', score: 88, total: 100 }, { label: 'Reflection 2', score: 91, total: 100 }] },
    { name: 'Community Project', weight: 40, instances: [{ label: 'Community Project', score: 85, total: 100 }] },
    { name: 'Presentation', weight: 30, instances: [{ label: 'Presentation', score: 88, total: 100 }] },
  ]);

  // ── Y1S2 criteria & scores ──────────────────────────────────────────────────
  const { criteria: cr21, entries: en21 } = makeCriteria(c21, [
    { name: 'Labs', weight: 20, instances: [{ label: 'Lab 1', score: 18, total: 20 }, { label: 'Lab 2', score: 17, total: 20 }, { label: 'Lab 3', score: 19, total: 20 }] },
    { name: 'Projects', weight: 25, instances: [{ label: 'Project 1', score: 83, total: 100 }, { label: 'Project 2', score: 88, total: 100 }] },
    { name: 'Midterm', weight: 25, instances: [{ label: 'Midterm', score: 78, total: 100 }] },
    { name: 'Final Exam', weight: 30, instances: [{ label: 'Final', score: 82, total: 100 }] },
  ]);
  const { criteria: cr22, entries: en22 } = makeCriteria(c22, [
    { name: 'Problem Sets', weight: 20, instances: [{ label: 'PS 1', score: 62, total: 100 }, { label: 'PS 2', score: 70, total: 100 }, { label: 'PS 3', score: 68, total: 100 }] },
    { name: 'Midterm', weight: 35, instances: [{ label: 'Midterm', score: 65, total: 100 }] },
    { name: 'Final Exam', weight: 45, instances: [{ label: 'Final', score: 70, total: 100 }] },
  ]);
  const { criteria: cr23, entries: en23 } = makeCriteria(c23, [
    { name: 'Assignments', weight: 25, instances: [{ label: 'Assignment 1', score: 80, total: 100 }, { label: 'Assignment 2', score: 85, total: 100 }] },
    { name: 'Midterm', weight: 35, instances: [{ label: 'Midterm', score: 78, total: 100 }] },
    { name: 'Final Exam', weight: 40, instances: [{ label: 'Final', score: 82, total: 100 }] },
  ]);
  const { criteria: cr24, entries: en24 } = makeCriteria(c24, [
    { name: 'Presentations', weight: 40, instances: [{ label: 'Presentation 1', score: 84, total: 100 }, { label: 'Presentation 2', score: 88, total: 100 }] },
    { name: 'Research Paper', weight: 60, instances: [{ label: 'Research Paper', score: 82, total: 100 }] },
  ]);
  const { criteria: cr25, entries: en25 } = makeCriteria(c25, [
    { name: 'Lab Reports', weight: 20, instances: [{ label: 'Lab 1', score: 16, total: 20 }, { label: 'Lab 2', score: 15, total: 20 }] },
    { name: 'Midterm', weight: 35, instances: [{ label: 'Midterm', score: 72, total: 100 }] },
    { name: 'Final Exam', weight: 45, instances: [{ label: 'Final', score: 75, total: 100 }] },
  ]);

  // ── Y2S1 criteria & scores ──────────────────────────────────────────────────
  const { criteria: cr31, entries: en31 } = makeCriteria(c31, [
    { name: 'Assignments', weight: 20, instances: [{ label: 'Assignment 1', score: 85, total: 100 }, { label: 'Assignment 2', score: 90, total: 100 }, { label: 'Assignment 3', score: 88, total: 100 }] },
    { name: 'Midterm', weight: 30, instances: [{ label: 'Midterm', score: 80, total: 100 }] },
    { name: 'Final Exam', weight: 50, instances: [{ label: 'Final', score: 83, total: 100 }] },
  ]);
  const { criteria: cr32, entries: en32 } = makeCriteria(c32, [
    { name: 'Labs', weight: 25, instances: [{ label: 'Lab 1', score: 18, total: 25 }, { label: 'Lab 2', score: 20, total: 25 }, { label: 'Lab 3', score: 22, total: 25 }] },
    { name: 'Midterm', weight: 30, instances: [{ label: 'Midterm', score: 74, total: 100 }] },
    { name: 'Final Exam', weight: 45, instances: [{ label: 'Final', score: 78, total: 100 }] },
  ]);
  const { criteria: cr33, entries: en33 } = makeCriteria(c33, [
    { name: 'Problem Sets', weight: 20, instances: [{ label: 'PS 1', score: 78, total: 100 }, { label: 'PS 2', score: 82, total: 100 }] },
    { name: 'Midterm', weight: 35, instances: [{ label: 'Midterm', score: 76, total: 100 }] },
    { name: 'Final Exam', weight: 45, instances: [{ label: 'Final', score: 80, total: 100 }] },
  ]);
  const { criteria: cr34, entries: en34 } = makeCriteria(c34, [
    { name: 'Projects', weight: 40, instances: [{ label: 'Project 1', score: 86, total: 100 }, { label: 'Project 2', score: 90, total: 100 }] },
    { name: 'Midterm', weight: 25, instances: [{ label: 'Midterm', score: 82, total: 100 }] },
    { name: 'Final Exam', weight: 35, instances: [{ label: 'Final', score: 85, total: 100 }] },
  ]);
  const { criteria: cr35, entries: en35 } = makeCriteria(c35, [
    { name: 'Business Plan', weight: 50, instances: [{ label: 'Business Plan', score: 88, total: 100 }] },
    { name: 'Pitch', weight: 30, instances: [{ label: 'Pitch', score: 84, total: 100 }] },
    { name: 'Reflection', weight: 20, instances: [{ label: 'Reflection', score: 90, total: 100 }] },
  ]);

  // ── Y2S2 criteria & scores (active — partially scored) ─────────────────────
  const { criteria: cr41, entries: en41 } = makeCriteria(c41, [
    { name: 'Quizzes', weight: 15, instances: [{ label: 'Quiz 1', score: 17, total: 20 }, { label: 'Quiz 2', score: 15, total: 20 }, { label: 'Quiz 3', score: null, total: 20 }] },
    { name: 'Labs', weight: 25, instances: [{ label: 'Lab 1', score: 22, total: 25 }, { label: 'Lab 2', score: null, total: 25 }, { label: 'Lab 3', score: null, total: 25 }] },
    { name: 'Midterm', weight: 25, instances: [{ label: 'Midterm', score: 78, total: 100 }] },
    { name: 'Final Exam', weight: 35, instances: [{ label: 'Final', score: null, total: 100 }] },
  ]);
  const { criteria: cr42, entries: en42 } = makeCriteria(c42, [
    { name: 'Assignments', weight: 20, instances: [{ label: 'Assignment 1', score: 80, total: 100 }, { label: 'Assignment 2', score: 85, total: 100 }, { label: 'Assignment 3', score: null, total: 100 }] },
    { name: 'Midterm', weight: 30, instances: [{ label: 'Midterm', score: 74, total: 100 }] },
    { name: 'Final Project', weight: 20, instances: [{ label: 'Final Project', score: null, total: 100 }] },
    { name: 'Final Exam', weight: 30, instances: [{ label: 'Final', score: null, total: 100 }] },
  ]);
  const { criteria: cr43, entries: en43 } = makeCriteria(c43, [
    { name: 'Problem Sets', weight: 20, instances: [{ label: 'PS 1', score: 75, total: 100 }, { label: 'PS 2', score: 70, total: 100 }] },
    { name: 'Lab Work', weight: 20, instances: [{ label: 'Lab 1', score: 18, total: 20 }, { label: 'Lab 2', score: null, total: 20 }] },
    { name: 'Midterm', weight: 25, instances: [{ label: 'Midterm', score: 72, total: 100 }] },
    { name: 'Final Exam', weight: 35, instances: [{ label: 'Final', score: null, total: 100 }] },
  ]);
  const { criteria: cr44, entries: en44 } = makeCriteria(c44, [
    { name: 'Homework', weight: 20, instances: [{ label: 'HW 1', score: 88, total: 100 }, { label: 'HW 2', score: 92, total: 100 }, { label: 'HW 3', score: null, total: 100 }] },
    { name: 'Midterm', weight: 35, instances: [{ label: 'Midterm', score: 82, total: 100 }] },
    { name: 'Final Exam', weight: 45, instances: [{ label: 'Final', score: null, total: 100 }] },
  ]);
  const { criteria: cr45, entries: en45 } = makeCriteria(c45, [
    { name: 'Sprint Reviews', weight: 20, instances: [{ label: 'Sprint 1', score: 85, total: 100 }, { label: 'Sprint 2', score: 88, total: 100 }, { label: 'Sprint 3', score: null, total: 100 }] },
    { name: 'Documentation', weight: 20, instances: [{ label: 'SRS', score: 82, total: 100 }, { label: 'Design Doc', score: null, total: 100 }] },
    { name: 'Group Project', weight: 35, instances: [{ label: 'Final System', score: null, total: 100 }] },
    { name: 'Final Exam', weight: 25, instances: [{ label: 'Final', score: null, total: 100 }] },
  ]);

  const allCriteria = [
    ...cr11, ...cr12, ...cr13, ...cr14, ...cr15,
    ...cr21, ...cr22, ...cr23, ...cr24, ...cr25,
    ...cr31, ...cr32, ...cr33, ...cr34, ...cr35,
    ...cr41, ...cr42, ...cr43, ...cr44, ...cr45,
  ];
  const allEntries = [
    ...en11, ...en12, ...en13, ...en14, ...en15,
    ...en21, ...en22, ...en23, ...en24, ...en25,
    ...en31, ...en32, ...en33, ...en34, ...en35,
    ...en41, ...en42, ...en43, ...en44, ...en45,
  ];

  await db.transaction('rw', db.semesters, db.courses, db.criteria, db.scoreEntries, async () => {
    await db.semesters.bulkAdd(semesters);
    await db.courses.bulkAdd(allCourses);
    await db.criteria.bulkAdd(allCriteria);
    await db.scoreEntries.bulkAdd(allEntries);
  });
}

export async function clearAndReseed() {
  await db.transaction('rw', db.semesters, db.courses, db.criteria, db.scoreEntries, async () => {
    await db.semesters.clear();
    await db.courses.clear();
    await db.criteria.clear();
    await db.scoreEntries.clear();
  });
  await seedDatabase();
}
