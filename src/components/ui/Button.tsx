import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 rounded-full font-serif font-medium transition-all cursor-pointer select-none shrink-0 disabled:opacity-40 disabled:cursor-not-allowed',
          {
            sm: 'h-[30px] px-3 text-[13px]',
            md: 'h-9 px-4 text-[14px]',
            lg: 'h-11 px-5 text-[15px]',
          }[size],
          {
            default: 'bg-(--c-surface-2) text-(--c-text) border border-(--c-line-2) hover:bg-(--c-surface-3) hover:border-(--c-line-3)',
            primary: 'bg-(--c-text) text-(--c-bg) hover:opacity-90',
            ghost: 'bg-transparent text-(--c-text-2) hover:bg-(--c-surface-2) hover:text-(--c-text)',
            danger: 'bg-transparent text-[oklch(0.7_0.1_15)] border border-[oklch(0.7_0.1_15_/_0.3)] hover:bg-[oklch(0.7_0.1_15_/_0.1)]',
          }[variant],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
