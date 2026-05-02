import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  trackClassName?: string;
}

export function ProgressBar({ value, className, trackClassName }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={cn('h-1.5 rounded-full bg-(--c-surface-3) overflow-hidden', trackClassName)}>
      <motion.div
        className={cn('h-full rounded-full', className)}
        style={{ background: 'linear-gradient(90deg, var(--c-accent) 0%, var(--c-accent-2) 100%)' }}
        initial={{ width: '0%' }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.55, ease: 'easeOut', delay: 0.1 }}
      />
    </div>
  );
}
