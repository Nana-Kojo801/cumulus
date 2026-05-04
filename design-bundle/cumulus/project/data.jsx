// ─────────────────────────────────────────────────────────────────
// Cumulus — data model, grade scale, calculations, seed data
// ─────────────────────────────────────────────────────────────────

// Ashesi grade scale (per spec)
const GRADE_SCALE = [
  { letter: "A+", min: 85, max: 100, points: 4.0 },
  { letter: "A",  min: 80, max: 84.999, points: 4.0 },
  { letter: "B+", min: 75, max: 79.999, points: 3.5 },
  { letter: "B",  min: 70, max: 74.999, points: 3.0 },
  { letter: "C+", min: 65, max: 69.999, points: 2.5 },
  { letter: "C",  min: 60, max: 64.999, points: 2.0 },
  { letter: "D+", min: 55, max: 59.999, points: 1.5 },
  { letter: "D",  min: 50, max: 54.999, points: 1.0 },
  { letter: "E",  min: 0,  max: 49.999, points: 0.0 },
];

function letterFor(pct) {
  if (pct == null || isNaN(pct)) return "—";
  const row = GRADE_SCALE.find(r => pct >= r.min && pct <= r.max);
  return row ? row.letter : "—";
}
function pointsFor(pct) {
  if (pct == null || isNaN(pct)) return null;
  const row = GRADE_SCALE.find(r => pct >= r.min && pct <= r.max);
  return row ? row.points : 0;
}
function pointsForLetter(letter) {
  const row = GRADE_SCALE.find(r => r.letter === letter);
  return row ? row.points : 0;
}

// Compute the running average for a criterion (only counts completed entries)
function criterionAverage(crit) {
  const done = crit.entries.filter(e => e.score != null && e.total != null && e.total > 0);
  if (done.length === 0) return null;
  const sum = done.reduce((s, e) => s + (e.score / e.total) * 100, 0);
  return sum / done.length;
}
function criterionCompletion(crit) {
  const done = crit.entries.filter(e => e.score != null).length;
  return { done, total: crit.entries.length };
}

// Course running grade — weighted by criteria that have at least one entry,
// renormalized so we report "current standing on completed work"
function courseRunningGrade(course) {
  let weighted = 0, weightUsed = 0;
  for (const c of course.criteria) {
    const avg = criterionAverage(c);
    if (avg == null) continue;
    weighted += avg * (c.weight / 100);
    weightUsed += c.weight;
  }
  if (weightUsed === 0) return { pct: null, weightCompleted: 0 };
  return { pct: weighted / (weightUsed / 100), weightCompleted: weightUsed };
}

// Projected final grade if pending criteria are scored at `assumeAvg` (default null = same as current)
function courseProjectedGrade(course, assumeAvg = null) {
  let total = 0;
  for (const c of course.criteria) {
    const avg = criterionAverage(c);
    const use = avg != null ? avg : (assumeAvg != null ? assumeAvg : 0);
    total += use * (c.weight / 100);
  }
  return total;
}

// Semester GPA = sum(points * credits) / sum(credits) over courses with completed work
function semesterGPA(semester, courses) {
  const list = courses.filter(c => c.semesterId === semester.id);
  let pts = 0, credits = 0;
  for (const co of list) {
    const { pct } = courseRunningGrade(co);
    if (pct == null) continue;
    pts += pointsFor(pct) * co.credits;
    credits += co.credits;
  }
  return { gpa: credits ? pts / credits : null, credits };
}
function cumulativeGPA(semesters, courses) {
  let pts = 0, credits = 0;
  for (const s of semesters) {
    const list = courses.filter(c => c.semesterId === s.id);
    for (const co of list) {
      const { pct } = courseRunningGrade(co);
      if (pct == null) continue;
      pts += pointsFor(pct) * co.credits;
      credits += co.credits;
    }
  }
  return { gpa: credits ? pts / credits : null, credits };
}

// "What score do I need" — given target letter, pending weight, current weighted points,
// returns required average across pending work (or null if impossible)
function requiredAverage(course, targetLetter) {
  const targetPct = (() => {
    const row = GRADE_SCALE.find(r => r.letter === targetLetter);
    return row ? row.min : 0;
  })();
  let earned = 0, pendingWeight = 0;
  for (const c of course.criteria) {
    const avg = criterionAverage(c);
    if (avg != null) earned += avg * (c.weight / 100);
    // weight of remaining instances
    const { done, total } = criterionCompletion(c);
    if (total === 0 || done < total) {
      const fractionPending = total === 0 ? 1 : (total - done) / total;
      pendingWeight += c.weight * fractionPending;
    }
  }
  if (pendingWeight <= 0) return { pendingWeight: 0, required: null, achievable: earned };
  const need = (targetPct - earned) / (pendingWeight / 100);
  return {
    pendingWeight,
    required: need,
    earned,
    targetPct,
    impossible: need > 100,
    trivial: need < 0,
    maxAchievable: earned + pendingWeight, // if you got 100 on everything pending
  };
}

// ─────────────────────────────────────────────────────────────────
// Seed data — realistic Ashesi-style CS major mid Year 2 Sem 2
// ─────────────────────────────────────────────────────────────────

const SEMESTERS = [
  { id: "s1", name: "Year 1 · Semester 1", year: 1, term: 1, status: "complete" },
  { id: "s2", name: "Year 1 · Semester 2", year: 1, term: 2, status: "complete" },
  { id: "s3", name: "Year 2 · Semester 1", year: 2, term: 1, status: "complete" },
  { id: "s4", name: "Year 2 · Semester 2", year: 2, term: 2, status: "active" },
];

// Helper to make filled criteria
function crit(name, weight, scores /* [[score,total], ...] */, count = null) {
  const total = count ?? scores.length;
  const entries = [];
  for (let i = 0; i < total; i++) {
    if (scores[i]) entries.push({ id: `${name}-${i}`, label: `${name} ${i+1}`, score: scores[i][0], total: scores[i][1] });
    else entries.push({ id: `${name}-${i}`, label: `${name} ${i+1}`, score: null, total: scores[0]?.[1] ?? 100 });
  }
  return { id: `c-${name.replace(/\s/g,"")}-${Math.random().toString(36).slice(2,6)}`, name, weight, entries };
}

const COURSES = [
  // Year 1 Sem 1 — complete
  { id: "co1", semesterId: "s1", code: "CS 111", name: "Computer Science I", credits: 4, criteria: [
    crit("Quiz", 20, [[18,20],[19,20],[17,20],[20,20]]),
    crit("Midterm", 30, [[82,100]]),
    crit("Project", 20, [[88,100]]),
    crit("Final", 30, [[78,100]]),
  ]},
  { id: "co2", semesterId: "s1", code: "MATH 141", name: "Pre-Calculus", credits: 3, criteria: [
    crit("Homework", 15, [[92,100],[88,100],[85,100],[90,100],[87,100]]),
    crit("Midterm", 35, [[74,100]]),
    crit("Final", 50, [[71,100]]),
  ]},
  { id: "co3", semesterId: "s1", code: "ENG 111", name: "Written & Oral Communication", credits: 3, criteria: [
    crit("Essays", 40, [[80,100],[83,100],[85,100]]),
    crit("Presentation", 25, [[88,100]]),
    crit("Final Paper", 35, [[81,100]]),
  ]},
  { id: "co4", semesterId: "s1", code: "BUSA 111", name: "Foundations of Design & Entrepreneurship", credits: 3, criteria: [
    crit("Project", 50, [[78,100]]),
    crit("Reflection", 20, [[85,100]]),
    crit("Final", 30, [[76,100]]),
  ]},

  // Year 1 Sem 2
  { id: "co5", semesterId: "s2", code: "CS 112", name: "Computer Science II", credits: 4, criteria: [
    crit("Lab", 25, [[95,100],[88,100],[92,100],[90,100]]),
    crit("Midterm", 30, [[81,100]]),
    crit("Project", 20, [[86,100]]),
    crit("Final", 25, [[83,100]]),
  ]},
  { id: "co6", semesterId: "s2", code: "MATH 142", name: "Calculus I", credits: 3, criteria: [
    crit("Quiz", 20, [[16,20],[18,20],[15,20],[19,20]]),
    crit("Midterm", 35, [[68,100]]),
    crit("Final", 45, [[72,100]]),
  ]},
  { id: "co7", semesterId: "s2", code: "STAT 211", name: "Statistics for Engineers", credits: 3, criteria: [
    crit("Assignment", 30, [[82,100],[78,100],[85,100]]),
    crit("Midterm", 30, [[77,100]]),
    crit("Final", 40, [[80,100]]),
  ]},
  { id: "co8", semesterId: "s2", code: "BUSA 112", name: "Leadership Seminar I", credits: 1, criteria: [
    crit("Reflection", 60, [[88,100],[90,100]]),
    crit("Participation", 40, [[85,100]]),
  ]},

  // Year 2 Sem 1
  { id: "co9", semesterId: "s3", code: "CS 211", name: "Discrete Structures & Theory", credits: 3, criteria: [
    crit("Homework", 30, [[88,100],[82,100],[90,100],[85,100]]),
    crit("Midterm", 30, [[79,100]]),
    crit("Final", 40, [[81,100]]),
  ]},
  { id: "co10", semesterId: "s3", code: "CS 212", name: "Data Structures & Algorithms", credits: 4, criteria: [
    crit("Lab", 20, [[18,20],[19,20],[17,20],[20,20],[18,20]]),
    crit("Project", 25, [[91,100]]),
    crit("Midterm", 25, [[84,100]]),
    crit("Final", 30, [[82,100]]),
  ]},
  { id: "co11", semesterId: "s3", code: "BUSA 211", name: "Microeconomics", credits: 3, criteria: [
    crit("Quiz", 20, [[14,20],[16,20],[15,20]]),
    crit("Midterm", 35, [[71,100]]),
    crit("Final", 45, [[74,100]]),
  ]},
  { id: "co12", semesterId: "s3", code: "ENGR 213", name: "Linear Algebra", credits: 3, criteria: [
    crit("Assignment", 25, [[85,100],[80,100],[82,100]]),
    crit("Midterm", 35, [[76,100]]),
    crit("Final", 40, [[78,100]]),
  ]},

  // Year 2 Sem 2 — ACTIVE, partially complete
  { id: "co13", semesterId: "s4", code: "CS 311", name: "Database Systems", credits: 3, criteria: [
    crit("Lab", 20, [[18,20],[19,20],[17,20], null, null], 5),
    crit("Project", 30, [[88,100], null], 2),
    crit("Midterm", 20, [[82,100]]),
    crit("Final", 30, [null], 1),
  ]},
  { id: "co14", semesterId: "s4", code: "CS 313", name: "Computer Networks", credits: 3, criteria: [
    crit("Quiz", 15, [[15,20],[17,20], null, null], 4),
    crit("Lab", 20, [[88,100],[92,100], null], 3),
    crit("Midterm", 25, [[79,100]]),
    crit("Project", 15, [null], 1),
    crit("Final", 25, [null], 1),
  ]},
  { id: "co15", semesterId: "s4", code: "CS 315", name: "Software Engineering", credits: 3, criteria: [
    crit("Sprint Review", 30, [[90,100],[85,100], null, null], 4),
    crit("Midterm", 25, [[81,100]]),
    crit("Group Project", 30, [null], 1),
    crit("Final", 15, [null], 1),
  ]},
  { id: "co16", semesterId: "s4", code: "MATH 250", name: "Numerical Methods", credits: 3, criteria: [
    crit("Homework", 25, [[80,100],[78,100],[85,100], null, null], 5),
    crit("Midterm", 30, [[72,100]]),
    crit("Project", 20, [null], 1),
    crit("Final", 25, [null], 1),
  ]},
  { id: "co17", semesterId: "s4", code: "BUSA 311", name: "Ethics & Social Responsibility", credits: 2, criteria: [
    crit("Essay", 40, [[88,100],[85,100], null], 3),
    crit("Reflection", 20, [[90,100]]),
    crit("Final Paper", 40, [null], 1),
  ]},
];

// Make sure we expose to other Babel scripts
Object.assign(window, {
  GRADE_SCALE, letterFor, pointsFor, pointsForLetter,
  criterionAverage, criterionCompletion,
  courseRunningGrade, courseProjectedGrade,
  semesterGPA, cumulativeGPA, requiredAverage,
  SEMESTERS, COURSES,
});
