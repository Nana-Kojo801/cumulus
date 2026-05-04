import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Course } from '@/db/schema';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmt(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

export function fmtGPA(n: number | null): string {
  if (n === null) return '—';
  return n.toFixed(2);
}

export function fmtPct(n: number | null, decimals = 1): string {
  if (n === null || isNaN(n)) return '—';
  return `${n.toFixed(decimals)}%`;
}

export function cleanCourseName(name: string): string {
  return name.replace(/^\[[^\]]*\]\s*-?\s*/, '').trim();
}

export function displayCourseName(course: Course, useShort: boolean): string {
  if (useShort && course.shortName) return course.shortName;
  return cleanCourseName(course.name);
}
