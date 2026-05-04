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
          'c-btn',
          variant === 'primary' && 'primary',
          variant === 'ghost' && 'ghost',
          variant === 'danger' && 'danger',
          size === 'sm' && 'sm',
          size === 'lg' && 'lg',
          variant === 'danger' && 'bg-transparent text-(--c-grade-e) border border-(--c-grade-e)/30 hover:bg-(--c-grade-e)/10 shadow-none hover:!transform-none',
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
