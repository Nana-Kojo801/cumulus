import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface GradePillProps extends HTMLAttributes<HTMLSpanElement> {
  letter: string;
  size?: 'sm' | 'md' | 'lg';
}

const BAND_STYLES: Record<string, string> = {
  a: 'bg-(--c-grade-a)/18 text-(--c-grade-a) border-(--c-grade-a)/40 shadow-[inset_0_1px_0_oklch(1_0_0/0.08)]',
  b: 'bg-(--c-grade-b)/18 text-(--c-grade-b) border-(--c-grade-b)/40 shadow-[inset_0_1px_0_oklch(1_0_0/0.08)]',
  c: 'bg-(--c-grade-c)/18 text-(--c-grade-c) border-(--c-grade-c)/40 shadow-[inset_0_1px_0_oklch(1_0_0/0.08)]',
  d: 'bg-(--c-grade-d)/18 text-(--c-grade-d) border-(--c-grade-d)/40 shadow-[inset_0_1px_0_oklch(1_0_0/0.08)]',
  e: 'bg-(--c-grade-e)/18 text-(--c-grade-e) border-(--c-grade-e)/40 shadow-[inset_0_1px_0_oklch(1_0_0/0.08)]',
};

export function GradePill({ letter, size = 'md', className, ...props }: GradePillProps) {
  const band = letter && letter !== '—' ? letter[0].toUpperCase() : '-';
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full border font-semibold tabular-nums tracking-tight',
        {
          sm: 'px-1.5 py-0 text-[11px] min-w-6.5',
          md: 'px-2 py-0.5 text-[13px] min-w-8.5',
          lg: 'px-3 py-1 text-[16px] min-w-11',
        }[size],
        BAND_STYLES[band.toLowerCase()] ?? BAND_STYLES.e,
        className
      )}
      data-band={band}
      {...props}
    >
      {letter || '—'}
    </span>
  );
}
