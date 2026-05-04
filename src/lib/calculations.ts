import type { Course, Criterion, ScoreEntry, Semester } from '@/db/schema';
import { letterFor, pointsFor, minPctForLetter, GRADE_SCALE } from './gradeScale';

export { letterFor, pointsFor };

export function criterionAverage(entries: ScoreEntry[]): number | null {
  const scored = entries.filter(e => e.score !== null && !isNaN(e.score!) && e.total > 0);
  if (scored.length === 0) return null;
  const totalPoints = scored.reduce((acc, e) => acc + e.total, 0);
  const earnedPoints = scored.reduce((acc, e) => acc + e.score!, 0);
  return (earnedPoints / totalPoints) * 100;
}

export function courseRunningGrade(
  _course: Course,
  criteria: Criterion[],
  entries: ScoreEntry[]
): { pct: number | null; weightCompleted: number } {
  let weightedSum = 0;
  let weightCompleted = 0;

  for (const crit of criteria) {
    const critEntries = entries.filter(e => e.criterionId === crit.id);
    const avg = criterionAverage(critEntries);
    if (avg !== null) {
      weightedSum += avg * (crit.weight / 100);
      weightCompleted += crit.weight;
    }
  }

  if (weightCompleted === 0) return { pct: null, weightCompleted: 0 };

  const normalised = weightedSum / (weightCompleted / 100);
  return { pct: normalised, weightCompleted };
}

export function semesterGPA(
  semesterId: string,
  courses: Course[],
  criteria: Criterion[],
  entries: ScoreEntry[]
): { gpa: number | null; credits: number } {
  const semCourses = courses.filter(c => c.semesterId === semesterId);
  if (semCourses.length === 0) return { gpa: null, credits: 0 };

  let totalCredits = 0;
  let weightedPoints = 0;
  let counted = 0;

  for (const course of semCourses) {
    const courseCriteria = criteria.filter(cr => cr.courseId === course.id);
    const courseEntries = entries.filter(e =>
      courseCriteria.some(cr => cr.id === e.criterionId)
    );
    const { pct } = courseRunningGrade(course, courseCriteria, courseEntries);
    if (pct !== null) {
      weightedPoints += pointsFor(pct) * course.credits;
      totalCredits += course.credits;
      counted++;
    }
  }

  if (counted === 0) return { gpa: null, credits: totalCredits };
  return { gpa: weightedPoints / totalCredits, credits: totalCredits };
}

export function cumulativeGPA(
  semesters: Semester[],
  courses: Course[],
  criteria: Criterion[],
  entries: ScoreEntry[]
): { gpa: number | null; credits: number } {
  let totalCredits = 0;
  let weightedPoints = 0;
  let counted = 0;

  for (const sem of semesters) {
    const { gpa, credits } = semesterGPA(sem.id, courses, criteria, entries);
    if (gpa !== null && credits > 0) {
      weightedPoints += gpa * credits;
      totalCredits += credits;
      counted++;
    }
  }

  if (counted === 0) return { gpa: null, credits: totalCredits };
  return { gpa: weightedPoints / totalCredits, credits: totalCredits };
}

export function requiredAverage(
  _course: Course,
  criteria: Criterion[],
  entries: ScoreEntry[],
  targetLetter: string
): {
  pendingWeight: number;
  required: number | null;
  earned: number;
  targetPct: number;
  impossible: boolean;
  trivial: boolean;
  maxAchievable: number;
} {
  const targetPct = minPctForLetter(targetLetter);
  let earnedWeighted = 0;
  let completedWeight = 0;
  let pendingWeight = 0;

  for (const crit of criteria) {
    const critEntries = entries.filter(e => e.criterionId === crit.id);
    const avg = criterionAverage(critEntries);
    if (avg !== null) {
      earnedWeighted += avg * (crit.weight / 100);
      completedWeight += crit.weight;
    } else {
      pendingWeight += crit.weight;
    }
  }

  const maxAchievable = earnedWeighted + pendingWeight;
  const earned = completedWeight > 0 ? earnedWeighted / (completedWeight / 100) : 0;

  if (pendingWeight === 0) {
    const currentGrade = earnedWeighted;
    return {
      pendingWeight: 0,
      required: null,
      earned: currentGrade,
      targetPct,
      impossible: currentGrade < targetPct,
      trivial: currentGrade >= targetPct,
      maxAchievable: currentGrade,
    };
  }

  const needed = (targetPct - earnedWeighted) / (pendingWeight / 100);
  return {
    pendingWeight,
    required: needed,
    earned,
    targetPct,
    impossible: needed > 100,
    trivial: needed <= 0,
    maxAchievable,
  };
}

export function requiredOnEntry(
  _course: Course,
  criteria: Criterion[],
  entries: ScoreEntry[],
  targetLetter: string,
  entryId: string
): {
  needed: number | null;
  neededPct: number | null;
  impossible: boolean;
  alreadySecured: boolean;
} {
  const targetEntry = entries.find(e => e.id === entryId);
  if (!targetEntry) return { needed: null, neededPct: null, impossible: false, alreadySecured: false };

  const targetCrit = criteria.find(c => c.id === targetEntry.criterionId);
  if (!targetCrit) return { needed: null, neededPct: null, impossible: false, alreadySecured: false };

  const targetPct = minPctForLetter(targetLetter);
  let earnedWeighted = 0;
  let thisEntryWeight = 0;

  for (const crit of criteria) {
    const critEntries = entries.filter(e => e.criterionId === crit.id);

    if (crit.id === targetCrit.id) {
      const entryCount = critEntries.length;
      if (entryCount === 0) continue;

      const weightPerEntry = crit.weight / entryCount;
      thisEntryWeight = weightPerEntry;

      const otherEntries = critEntries.filter(e => e.id !== entryId);
      const scoredOther = otherEntries.filter(e => e.score !== null && e.total > 0);
      const pendingOther = otherEntries.filter(e => e.score === null);

      for (const e of scoredOther) {
        earnedWeighted += (e.score! / e.total) * 100 * (weightPerEntry / 100);
      }

      if (scoredOther.length > 0) {
        const otherAvg = scoredOther.reduce((a, e) => a + (e.score! / e.total) * 100, 0) / scoredOther.length;
        for (const _pe of pendingOther) {
          earnedWeighted += otherAvg * (weightPerEntry / 100);
        }
      }
    } else {
      const avg = criterionAverage(critEntries);
      if (avg !== null) {
        earnedWeighted += avg * (crit.weight / 100);
      }
    }
  }

  const needed = thisEntryWeight > 0
    ? (targetPct - earnedWeighted) / (thisEntryWeight / 100)
    : null;

  if (needed === null) return { needed: null, neededPct: null, impossible: false, alreadySecured: false };

  return {
    needed: (needed / 100) * targetEntry.total,
    neededPct: needed,
    impossible: needed > 100,
    alreadySecured: needed <= 0,
  };
}

export function gpaHistory(
  semesters: Semester[],
  courses: Course[],
  criteria: Criterion[],
  entries: ScoreEntry[]
): Array<{ label: string; gpa: number | null }> {
  const sorted = [...semesters].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
  return sorted.map(s => ({
    label: s.name,
    gpa: semesterGPA(s.id, courses, criteria, entries).gpa,
  }));
}

export function letterForPoints(points: number): string {
  const match = GRADE_SCALE.find(g => g.points === points);
  return match?.letter ?? 'E';
}

export function honorFor(gpa: number | null): string | null {
  if (gpa === null) return null;
  if (gpa >= 3.85) return 'Summa Cum Laude';
  if (gpa >= 3.70) return 'Magna Cum Laude';
  if (gpa >= 3.50) return 'Cum Laude';
  return null;
}
