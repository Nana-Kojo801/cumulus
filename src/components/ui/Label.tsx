import { type LabelHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-[11px] uppercase tracking-[0.08em] text-(--c-text-3) font-serif',
        className
      )}
      {...props}
    />
  )
);
Label.displayName = 'Label';
