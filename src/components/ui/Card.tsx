import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-(--c-surface) border border-(--c-line) rounded-(--radius-r3)',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';
