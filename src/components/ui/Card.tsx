import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
<<<<<<< HEAD
      className={cn('c-card', className)}
=======
      className={cn(
        'bg-(--c-surface) border border-(--c-line) rounded-(--radius-r3) shadow-card',
        className
      )}
>>>>>>> f015a05a7e316a7e27334f0db0dad84b1bacc6e6
      {...props}
    />
  )
);
Card.displayName = 'Card';
