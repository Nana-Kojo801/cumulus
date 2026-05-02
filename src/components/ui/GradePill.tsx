import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { bandFor } from '@/lib/gradeScale';

interface GradePillProps extends HTMLAttributes<HTMLSpanElement> {
  letter: string;
  size?: 'sm' | 'md' | 'lg';
}

const BAND_STYLES: Record<string, string> = {
  a: 'bg-(--c-grade-a)/22 text-(--c-grade-a) border-(--c-grade-a)/45',
  b: 'bg-(--c-grade-b)/22 text-(--c-grade-b) border-(--c-grade-b)/45',
  c: 'bg-(--c-grade-c)/22 text-(--c-grade-c) border-(--c-grade-c)/45',
  d: 'bg-(--c-grade-d)/22 text-(--c-grade-d) border-(--c-grade-d)/45',
  e: 'bg-(--c-grade-e)/22 text-(--c-grade-e) border-(--c-grade-e)/45',
};

export function GradePill({ letter, size = 'md', className, ...props }: GradePillProps) {
  const band = bandFor(letter);
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full border font-serif font-medium tabular-nums',
        {
          sm: 'px-1.5 py-0 text-[11px] min-w-7',
          md: 'px-2 py-0.5 text-[13px] min-w-9',
          lg: 'px-3 py-1 text-[16px] min-w-12',
        }[size],
        BAND_STYLES[band] ?? BAND_STYLES.e,
        className
      )}
      {...props}
    >
      {letter}
    </span>
  );
}
