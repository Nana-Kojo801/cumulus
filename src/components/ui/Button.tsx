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
<<<<<<< HEAD
          'c-btn',
          variant === 'primary' && 'primary',
          variant === 'ghost' && 'ghost',
          variant === 'danger' && 'danger',
          size === 'sm' && 'sm',
          size === 'lg' && 'lg',
          variant === 'danger' && 'bg-transparent text-(--c-grade-e) border border-(--c-grade-e)/30 hover:bg-(--c-grade-e)/10 shadow-none hover:!transform-none',
=======
          'inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-all cursor-pointer select-none shrink-0 disabled:opacity-40 disabled:cursor-not-allowed',
          {
            sm: 'h-[30px] px-3.5 text-[13px]',
            md: 'h-9 px-4 text-[14px]',
            lg: 'h-11 px-6 text-[15px]',
          }[size],
          {
            default: 'bg-(--c-surface-2) text-(--c-text) border border-(--c-line-2) hover:bg-(--c-surface-3) hover:border-(--c-line-3)',
            primary: 'bg-(--c-accent) text-white hover:bg-(--c-accent-2) shadow-[0_1px_3px_oklch(0_0_0/0.3)]',
            ghost:   'bg-transparent text-(--c-text-3) hover:bg-(--c-surface-2) hover:text-(--c-text)',
            danger:  'bg-transparent text-(--c-grade-e) border border-(--c-grade-e)/30 hover:bg-(--c-grade-e)/10',
          }[variant],
>>>>>>> f015a05a7e316a7e27334f0db0dad84b1bacc6e6
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
