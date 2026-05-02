import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'h-11 w-full px-3 rounded-(--radius-r2) text-[16px] sm:text-[15px]',
          'bg-(--c-bg-2) border border-(--c-line) text-(--c-text)',
          'placeholder:text-(--c-text-4) outline-none transition-all',
          'focus:border-(--c-accent) focus:ring-1 focus:ring-(--c-accent)',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
