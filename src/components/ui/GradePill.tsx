import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface GradePillProps extends HTMLAttributes<HTMLSpanElement> {
  letter: string;
  size?: 'sm' | 'md' | 'lg';
}

export function GradePill({ letter, size = 'md', className, ...props }: GradePillProps) {
  const band = letter && letter !== '—' ? letter[0].toUpperCase() : '-';
  return (
    <span
      className={cn(
        'c-grade-pill',
        size === 'sm' && 'min-w-7.5 h-6 text-[11px] px-2',
        size === 'lg' && 'min-w-11 h-8 text-[14px] px-3',
        className
      )}
      data-band={band}
      {...props}
    >
      {letter || '—'}
    </span>
  );
}
