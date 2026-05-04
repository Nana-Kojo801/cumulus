import { useEffect, type ReactNode } from 'react';
<<<<<<< HEAD
import { IconX } from '@/components/icons';
=======
>>>>>>> f015a05a7e316a7e27334f0db0dad84b1bacc6e6
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { IconX } from '@/components/icons';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ open, onClose, title, children, className, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className={cn(
              'relative w-full bg-(--c-surface) border border-(--c-line-2) rounded-(--radius-r4) shadow-elevated flex flex-col max-h-[90vh]',
              { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' }[size],
              className
            )}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.18 }}
          >
            {title && (
              <div className="flex items-center justify-between px-5 py-4 border-b border-(--c-line) shrink-0">
                <h2 className="text-[16px] font-semibold text-(--c-text) tracking-tight">{title}</h2>
                <button
                  onClick={onClose}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-(--c-surface-2) text-(--c-text-3) hover:text-(--c-text) transition-all cursor-pointer"
                >
                  <IconX size={15} />
                </button>
              </div>
            )}
            <div className="overflow-y-auto flex-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
