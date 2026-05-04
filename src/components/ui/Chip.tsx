import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'solid' | 'accent';
}

export const Chip = forwardRef<HTMLSpanElement, ChipProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
<<<<<<< HEAD
        'c-chip',
        variant === 'accent' && 'accent',
=======
        'inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium',
        {
          default: 'bg-(--c-surface-3) text-(--c-text-3) border border-(--c-line)',
          solid:   'bg-(--c-surface-3) text-(--c-text) border border-(--c-line-2)',
          accent:  'bg-(--c-accent-bg) text-(--c-accent) border border-(--c-accent)/20',
        }[variant],
>>>>>>> f015a05a7e316a7e27334f0db0dad84b1bacc6e6
        className
      )}
      {...props}
    />
  )
);
Chip.displayName = 'Chip';
