export interface GradeEntry {
  letter: string;
  min: number;
  max: number;
  points: number;
  band: 'a' | 'b' | 'c' | 'd' | 'e';
}

export const GRADE_SCALE: GradeEntry[] = [
  { letter: 'A+', min: 85,    max: 100,   points: 4.0, band: 'a' },
  { letter: 'A',  min: 80,    max: 84.99, points: 4.0, band: 'a' },
  { letter: 'B+', min: 75,    max: 79.99, points: 3.5, band: 'b' },
  { letter: 'B',  min: 70,    max: 74.99, points: 3.0, band: 'b' },
  { letter: 'C+', min: 65,    max: 69.99, points: 2.5, band: 'c' },
  { letter: 'C',  min: 60,    max: 64.99, points: 2.0, band: 'c' },
  { letter: 'D+', min: 55,    max: 59.99, points: 1.5, band: 'd' },
  { letter: 'D',  min: 50,    max: 54.99, points: 1.0, band: 'd' },
  { letter: 'E',  min: 0,     max: 49.99, points: 0.0, band: 'e' },
];

export const TARGET_GRADES = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D'];

export function letterFor(pct: number): string {
  for (const g of GRADE_SCALE) {
    if (pct >= g.min) return g.letter;
  }
  return 'E';
}

export function pointsFor(pct: number): number {
  for (const g of GRADE_SCALE) {
    if (pct >= g.min) return g.points;
  }
  return 0;
}

export function bandFor(letter: string): GradeEntry['band'] {
  return GRADE_SCALE.find(g => g.letter === letter)?.band ?? 'e';
}

export function minPctForLetter(letter: string): number {
  return GRADE_SCALE.find(g => g.letter === letter)?.min ?? 0;
}

export function pointsForLetter(letter: string): number {
  return GRADE_SCALE.find(g => g.letter === letter)?.points ?? 0;
}
