import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Tag = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded-(--radius-r1) text-[11px] uppercase tracking-wider font-mono',
        'bg-(--c-bg-2) text-(--c-text-3) border border-(--c-line)',
        className
      )}
      {...props}
    />
  )
);
Tag.displayName = 'Tag';
